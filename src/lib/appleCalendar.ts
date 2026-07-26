/**
 * Apple Calendar integration — real on-device events via EventKit
 * (expo-calendar), not OAuth. iOS only: this is "the Calendar app on this
 * iPhone", so it only makes sense on the platform that has one.
 */

import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import type { CalendarEvent } from '@/lib/stores/useCalendar';
import { inferCategory } from './googleCalendar';
import { toISODate } from './dates';

export function isAppleCalendarSupported(): boolean {
  return Platform.OS === 'ios';
}

async function requestPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

function mapDeviceEvent(e: Calendar.Event): CalendarEvent {
  const start = new Date(e.startDate);
  // Local calendar date, not UTC — toISOString() shifts events before
  // UTC offset hours (and most all-day events) onto the previous day.
  const dateISO = toISODate(start);
  const timeLabel = e.allDay
    ? 'All day'
    : start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const title = e.title || 'Event';
  const categoryId = inferCategory(title);

  return {
    id: `ap-${e.id}`,
    title,
    categoryId,
    dateISO,
    timeLabel,
    // No reliable per-event privacy flag on-device; treat inferred
    // Personal/Sensitive events the same way the rest of the app does.
    isPrivate: categoryId === 'PERSONAL',
  };
}

/**
 * Requests on-device Calendar permission, then reads the next 30 days of
 * events from every calendar registered on the device. Throws if permission
 * is denied.
 */
export async function fetchAppleCalendarEvents(): Promise<CalendarEvent[]> {
  const granted = await requestPermission();
  if (!granted) {
    throw new Error(
      'Calendar access was not granted. Enable it for CycleAlign in iOS Settings to sync your events.',
    );
  }

  // Skip system noise calendars: subscribed holiday feeds ("Indian Holidays",
  // "US Holidays", …) and the auto-generated Birthdays calendar. Those aren't
  // plannable tasks, so scoring them against cycle phases is nonsense.
  const calendars = (await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)).filter(
    (c) =>
      c.type !== Calendar.CalendarType.BIRTHDAYS &&
      !/holiday/i.test(c.title ?? ''),
  );
  const calendarIds = calendars.map((c) => c.id);
  if (calendarIds.length === 0) return [];

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
  return events
    .map(mapDeviceEvent)
    .sort((a, b) => (a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0))
    .slice(0, 50);
}

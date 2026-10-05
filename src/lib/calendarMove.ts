/**
 * Moves a synced calendar event to a new date — the write side of the
 * "Better windows" suggestion. Each provider is handled separately because
 * their write APIs and their rules differ, but they share three safety rules:
 *  - repeating events are never moved (it would be ambiguous which ones);
 *  - an event other people are invited to is only moved by its organizer;
 *  - the time of day and the duration are always kept — only the date changes.
 */

import * as Calendar from 'expo-calendar';
import { useCalendar, type CalendarEvent } from '@/lib/stores/useCalendar';
import { refreshGoogleAccessToken } from '@/lib/googleCalendar';
import { refreshOutlookAccessToken } from '@/lib/outlookCalendar';
import { addDaysISO, daysBetween, fromISODate, toISODate } from '@/lib/dates';

export type MoveFailure =
  | 'recurring'
  | 'not-organizer'
  | 'needs-reconnect'
  | 'not-signed-in'
  | 'failed';

export type MoveResult = { ok: true } | { ok: false; reason: MoveFailure; message?: string };

export type EventProvider = 'google' | 'outlook' | 'apple';

/** Provider events carry a prefix on their id (see the fetchers); anything else is a sample/demo event. */
export function providerOf(eventId: string): { provider: EventProvider; rawId: string } | null {
  if (eventId.startsWith('g-')) return { provider: 'google', rawId: eventId.slice(2) };
  if (eventId.startsWith('o-')) return { provider: 'outlook', rawId: eventId.slice(2) };
  if (eventId.startsWith('ap-')) return { provider: 'apple', rawId: eventId.slice(3) };
  return null;
}

const fail = (reason: MoveFailure, message?: string): MoveResult => ({ ok: false, reason, message });

/**
 * Moves a date-time by `delta` days and, optionally, `deltaMin` minutes of
 * wall-clock time. Anything after the seconds (offset / Z) is left as it was.
 */
function shiftDateTime(dt: string, delta: number, deltaMin = 0): string {
  if (deltaMin === 0) return addDaysISO(dt.slice(0, 10), delta) + dt.slice(10);
  const wall = dt.slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  const t = new Date(wall + 'Z');
  t.setUTCDate(t.getUTCDate() + delta);
  t.setUTCMinutes(t.getUTCMinutes() + deltaMin);
  return t.toISOString().slice(0, 19) + dt.slice(19);
}

// ── Google ────────────────────────────────────────────────────────────────────

async function googleFetch(url: string, init: RequestInit = {}, canRetry = true): Promise<Response | null> {
  const state = useCalendar.getState();
  if (!state.googleAccessToken) return null;
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${state.googleAccessToken}` },
  });
  if (res.status === 401 && canRetry && state.googleRefreshToken) {
    const fresh = await refreshGoogleAccessToken(state.googleRefreshToken);
    if (fresh) {
      useCalendar.getState().updateGoogleAccessToken(fresh);
      return googleFetch(url, init, false);
    }
  }
  return res;
}

interface GoogleTime { dateTime?: string; date?: string; timeZone?: string }

async function moveGoogle(rawId: string, newDateISO: string, deltaMin = 0): Promise<MoveResult> {
  const base = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(rawId)}`;
  const getRes = await googleFetch(base);
  if (!getRes) return fail('not-signed-in');
  if (getRes.status === 401) return fail('not-signed-in');
  if (!getRes.ok) return fail('failed');

  const ev = (await getRes.json()) as {
    start?: GoogleTime;
    end?: GoogleTime;
    recurringEventId?: string;
    recurrence?: string[];
    attendees?: unknown[];
    guestsCanModify?: boolean;
    organizer?: { self?: boolean };
  };
  if (ev.recurringEventId || ev.recurrence) return fail('recurring');
  if ((ev.attendees?.length ?? 0) > 0 && ev.organizer?.self !== true && ev.guestsCanModify !== true) {
    return fail('not-organizer');
  }
  if (!ev.start || !ev.end) return fail('failed');

  const oldDate = (ev.start.dateTime ?? ev.start.date ?? '').slice(0, 10);
  const delta = daysBetween(fromISODate(oldDate), fromISODate(newDateISO));
  if (delta === 0 && deltaMin === 0) return { ok: true };

  const shift = (t: GoogleTime): GoogleTime => {
    if (t.dateTime) {
      const shifted = shiftDateTime(t.dateTime, delta, deltaMin);
      // With a named time zone, drop the fixed offset so the zone (and any
      // daylight-saving change on the new date) decides the real offset.
      return t.timeZone
        ? { dateTime: shifted.replace(/(Z|[+-]\d{2}:\d{2})$/, ''), timeZone: t.timeZone }
        : { dateTime: shifted };
    }
    return { date: addDaysISO(t.date as string, delta) };
  };

  const patchRes = await googleFetch(`${base}?sendUpdates=all`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: shift(ev.start), end: shift(ev.end) }),
  });
  if (!patchRes) return fail('not-signed-in');
  if (patchRes.ok) return { ok: true };
  if (patchRes.status === 401) return fail('not-signed-in');
  if (patchRes.status === 403) {
    const body = (await patchRes.json().catch(() => ({}))) as { error?: { errors?: { reason?: string }[] } };
    const reason = body.error?.errors?.[0]?.reason ?? '';
    return reason.toLowerCase().includes('organizer') ? fail('not-organizer') : fail('needs-reconnect');
  }
  return fail('failed');
}

// ── Outlook / Microsoft Graph ─────────────────────────────────────────────────

async function outlookFetch(
  url: string,
  init: RequestInit = {},
  timeZone = 'UTC',
  canRetry = true,
): Promise<Response | null> {
  const state = useCalendar.getState();
  if (!state.outlookAccessToken) return null;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      Authorization: `Bearer ${state.outlookAccessToken}`,
      Prefer: `outlook.timezone="${timeZone}"`,
    },
  });
  if (res.status === 401 && canRetry && state.outlookRefreshToken) {
    const fresh = await refreshOutlookAccessToken(state.outlookRefreshToken);
    if (fresh) {
      // Microsoft rotates the refresh token on every use — store the new one.
      useCalendar.setState({ outlookAccessToken: fresh.accessToken, outlookRefreshToken: fresh.refreshToken });
      return outlookFetch(url, init, timeZone, false);
    }
  }
  return res;
}

interface GraphTime { dateTime: string; timeZone: string }
interface GraphEvent {
  type?: string;
  isOrganizer?: boolean;
  attendees?: unknown[];
  originalStartTimeZone?: string;
  start?: GraphTime;
  end?: GraphTime;
}

async function moveOutlook(rawId: string, newDateISO: string, deltaMin = 0): Promise<MoveResult> {
  const url = `https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(rawId)}`;
  const select = `?${encodeURIComponent('$select')}=type,isOrganizer,attendees,originalStartTimeZone,start,end`;

  const first = await outlookFetch(url + select);
  if (!first) return fail('not-signed-in');
  if (first.status === 401) return fail('not-signed-in');
  if (!first.ok) return fail('failed');
  let ev = (await first.json()) as GraphEvent;

  if (ev.type && ev.type !== 'singleInstance') return fail('recurring');
  if ((ev.attendees?.length ?? 0) > 0 && ev.isOrganizer === false) return fail('not-organizer');

  // Read the times in the zone the event was created in, so its wall-clock time
  // survives a daylight-saving change between the old and new date.
  let zone = 'UTC';
  const original = ev.originalStartTimeZone;
  if (original && original !== 'UTC' && !original.startsWith('tzone://')) {
    const again = await outlookFetch(url + select, {}, original);
    if (again?.ok) {
      ev = (await again.json()) as GraphEvent;
      zone = original;
    }
  }
  if (!ev.start || !ev.end) return fail('failed');

  const delta = daysBetween(fromISODate(ev.start.dateTime.slice(0, 10)), fromISODate(newDateISO));
  if (delta === 0 && deltaMin === 0) return { ok: true };

  const patch = await outlookFetch(
    url,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: { dateTime: shiftDateTime(ev.start.dateTime, delta, deltaMin), timeZone: ev.start.timeZone },
        end: { dateTime: shiftDateTime(ev.end.dateTime, delta, deltaMin), timeZone: ev.end.timeZone },
      }),
    },
    zone,
  );
  if (!patch) return fail('not-signed-in');
  if (patch.ok) return { ok: true };
  if (patch.status === 401) return fail('not-signed-in');
  // The ownership checks above already passed, so a refusal here means the
  // saved sign-in only has read access.
  if (patch.status === 403) return fail('needs-reconnect');
  return fail('failed');
}

// ── Apple Calendar (on-device) ────────────────────────────────────────────────

async function moveApple(rawId: string, newDateISO: string, deltaMin = 0): Promise<MoveResult> {
  try {
    const ev = await Calendar.getEventAsync(rawId);
    if (ev.recurrenceRule) return fail('recurring');
    // Same rule as Google/Outlook: an event she was only invited to belongs to
    // someone else's calendar, so don't try to move it.
    if (ev.organizer && !ev.organizer.isCurrentUser) return fail('not-organizer');

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendar = calendars.find((c) => c.id === ev.calendarId);
    if (calendar && !calendar.allowsModifications) {
      return fail('not-organizer', 'That calendar is read-only.');
    }

    const delta = daysBetween(fromISODate(toISODate(new Date(ev.startDate))), fromISODate(newDateISO));
    if (delta === 0 && deltaMin === 0) return { ok: true };

    // setDate keeps the local wall-clock time across a daylight-saving change.
    const shift = (d: string | Date) => {
      const x = new Date(d);
      x.setDate(x.getDate() + delta);
      x.setMinutes(x.getMinutes() + deltaMin);
      return x;
    };
    await Calendar.updateEventAsync(rawId, { startDate: shift(ev.startDate), endDate: shift(ev.endDate) });
    return { ok: true };
  } catch (err) {
    // EventKit refuses to edit an event you were only invited to.
    return fail('not-organizer', err instanceof Error ? err.message : undefined);
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Moves the event in its real calendar, then updates the local copy. Events
 * from the sample calendar have no provider, so they just move locally.
 */
export async function moveCalendarEvent(
  event: CalendarEvent,
  newDateISO: string,
  /** Optional new start time (minutes from midnight). Omit to keep the event's current time of day. */
  newStartMin?: number,
): Promise<MoveResult> {
  const deltaMin =
    newStartMin !== undefined && event.startMin !== undefined ? newStartMin - event.startMin : 0;
  const target = providerOf(event.id);
  let result: MoveResult = { ok: true };

  if (target) {
    try {
      result =
        target.provider === 'google'
          ? await moveGoogle(target.rawId, newDateISO, deltaMin)
          : target.provider === 'outlook'
            ? await moveOutlook(target.rawId, newDateISO, deltaMin)
            : await moveApple(target.rawId, newDateISO, deltaMin);
    } catch (err) {
      result = fail('failed', err instanceof Error ? err.message : undefined);
    }
  }

  if (result.ok) useCalendar.getState().moveEvent(event.id, newDateISO, deltaMin);
  return result;
}

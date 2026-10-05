import { Alert, Platform } from 'react-native';
import { format } from 'date-fns';
import { fromISODate } from '@/lib/dates';
import type { CalendarEvent } from '@/lib/stores/useCalendar';
import { moveCalendarEvent, providerOf, type MoveResult } from '@/lib/calendarMove';

/** Native dialogs on device, browser dialogs on web — shared by every screen that offers to move an event. */

export function confirmAsync(title: string, message: string, confirmLabel = 'Move it'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(title + '\n\n' + message));
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(title + '\n\n' + message);
  else Alert.alert(title, message);
}

export function failureText(res: Extract<MoveResult, { ok: false }>): string {
  switch (res.reason) {
    case 'recurring':
      return "This is a repeating event, so it can't be moved from here. Change it in your calendar app.";
    case 'not-organizer':
      return res.message ?? 'Only the organizer can move this event.';
    case 'needs-reconnect':
      return 'CycleAlign needs permission to change your calendar. Tap Disconnect, then Connect again, and allow it.';
    case 'not-signed-in':
      return 'Your calendar connection has expired. Tap Disconnect, then Connect again.';
    default:
      return res.message ?? 'Something went wrong. Please try again.';
  }
}

function clock(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min % 60).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

/**
 * Asks first, then moves. Never changes a calendar without her explicit OK.
 * Returns true only if the event was actually moved.
 */
export async function moveWithConfirmation(
  event: CalendarEvent,
  newDateISO: string,
  newStartMin?: number,
): Promise<boolean> {
  const day = format(fromISODate(newDateISO), 'EEE, d MMM');
  const when = newStartMin !== undefined && event.startMin !== undefined ? `${day} at ${clock(newStartMin)}` : day;
  const invited = providerOf(event.id) ? " If other people are invited, they'll be notified." : '';
  const ok = await confirmAsync('Move this event?', `Move "${event.title}" to ${when}?${invited}`);
  if (!ok) return false;
  const res = await moveCalendarEvent(event, newDateISO, newStartMin);
  if (!res.ok) {
    notify("Couldn't move it", failureText(res));
    return false;
  }
  return true;
}

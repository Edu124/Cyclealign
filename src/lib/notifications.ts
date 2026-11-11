import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { claimExtraSlot, installNotificationHandler } from '@/lib/notify/service';

/**
 * One-off notifications outside the daily plan (welcome, order confirmation,
 * the iOS referral nudge). The daily message and optional reminders are
 * planned by lib/notify — the old fixed 08:45 / 12:30 / 20:30 repeats and the
 * phase-change alert were retired by the Personalized Cycle Notifications spec
 * (one primary message a day, quiet hours, a daily cap, estimate wording).
 */

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';


/**
 * Fire-and-forget immediate notification (welcome, order confirmations…).
 * Only when she has already allowed notifications — this never triggers the
 * OS prompt by itself.
 */
export async function notifyNow(title: string, body: string): Promise<void> {
  if (!isSupported) return;
  try {
    installNotificationHandler();
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {}
}

// ── Canned one-shot messages ──────────────────────────────────────────────────

export function sendWelcomeNotification(name?: string) {
  const first = name?.trim().split(' ')[0];
  return notifyNow(
    first ? `Welcome, ${first} 💛` : 'Welcome to CycleAlign 💛',
    'Your cycle just became your superpower. Your dashboard is ready.',
  );
}

export function sendOrderNotification() {
  return notifyNow(
    'Order confirmed 🎀',
    'Someone is treating herself — your feel-good order is being prepared!',
  );
}

/**
 * iOS has no hook for "show UI at the instant of closing" — by the time the
 * app is told it's backgrounding, it can no longer present anything. A local
 * notification fired a few seconds later is the closest real equivalent:
 * it's triggered because they closed the app, not the next time they open
 * it. Returns the notification id so the caller can cancel it if the user
 * comes straight back before it fires.
 */
export async function scheduleReferralNudge(): Promise<string | null> {
  if (!isSupported) return null;
  try {
    // Never asks for permission itself, and shares quiet hours + the daily cap.
    if (!(await Notifications.getPermissionsAsync()).granted) return null;
    if (!claimExtraSlot(new Date(Date.now() + 8000))) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Miss you already 🌙',
        body: 'Refer 3 friends and get a month of CycleAlign free.',
      },
      trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 8 },
    });
  } catch {
    return null;
  }
}

export async function cancelReferralNudge(id: string): Promise<void> {
  if (!isSupported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

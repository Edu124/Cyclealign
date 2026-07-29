import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import type { Prediction } from '@/types/models';

/**
 * Local notification engine — everything is scheduled on-device, no push
 * server involved. The recurring set is (re)computed from the user's current
 * prediction every time the dashboard mounts, so timings track her cycle.
 *
 * Copy rule from the client: never mention "phase" in food/mood messages —
 * "based on your mood" phrasing instead.
 */

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

let handlerInstalled = false;
function installHandler() {
  if (handlerInstalled || !isSupported) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Ask the OS for permission (no-op where unsupported). Returns granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    installHandler();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'CycleAlign',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/** Fire-and-forget immediate notification (welcome, order confirmations…). */
export async function notifyNow(title: string, body: string): Promise<void> {
  if (!isSupported) return;
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {}
}

/**
 * Rebuild the recurring schedule. Cancels everything scheduled and re-plans:
 *  - 08:45 daily — morning briefing (energy + focus ready)
 *  - 12:30 daily — mood-based dish suggestions (no phase wording)
 *  - 20:30 daily — quick-log reminder
 *  - one-shot   — period heads-up two days before the predicted date
 * Call with null (or after opt-out) to clear everything.
 */
export async function syncScheduledNotifications(
  prediction: Prediction | null,
  enabled: boolean,
): Promise<void> {
  if (!isSupported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    const ok = await ensureNotificationPermission();
    if (!ok) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your day, decoded ✨',
        body: "Today's energy forecast and top focus are ready on your dashboard.",
      },
      trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 45 },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Cravings, sorted 🍜',
        body: 'Based on your mood today, your dishes are ready — take a peek.',
      },
      trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 12, minute: 30 },
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'How was today? 💛',
        body: '30 seconds: log your energy and mood — future you will thank you.',
      },
      trigger: { type: SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 30 },
    });

    // Period heads-up: two days before the predicted start, 09:00 local.
    if (prediction && prediction.daysUntilNextPeriod > 2) {
      const headsUp = new Date();
      headsUp.setDate(headsUp.getDate() + prediction.daysUntilNextPeriod - 2);
      headsUp.setHours(9, 0, 0, 0);
      if (headsUp.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'A gentle heads-up 🌙',
            body: 'Your period may arrive in a couple of days. A good moment to stock up and plan softer days.',
          },
          trigger: { type: SchedulableTriggerInputTypes.DATE, date: headsUp },
        });
      }
    }
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
    const ok = await ensureNotificationPermission();
    if (!ok) return null;
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

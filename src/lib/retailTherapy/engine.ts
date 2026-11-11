import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { DailyLog, Prediction } from '@/types/models';
import { capacityPhaseFor } from '@/lib/intelligence/capacity';
import { STOREFRONT_META, Storefront } from './catalog';
import { claimExtraSlot } from '@/lib/notify/service';

/**
 * Retail Therapy trigger engine. Detects the rough-patch moment (PMS window +
 * a low check-in) and fires the feel-good flash sale. All local, all opt-in.
 */

// The foreground handler is installed once by lib/notify/service.

const LOW_MOODS = ['rough', 'low'];

/** The rough-patch test: PMS-adjacent phase AND a low check-in today. */
export function isRoughPatch(prediction: Prediction, log: DailyLog): boolean {
  const phase = capacityPhaseFor(prediction);
  const pmsWindow = phase === 'luteal_late' || phase === 'menstrual';
  const lowLog = log.energy <= 2 || LOW_MOODS.includes(log.mood);
  return pmsWindow && lowLog;
}

/** Mood-stabilised test: a clearly good check-in. */
export function isStabilised(log: DailyLog): boolean {
  return log.energy >= 4 && (log.mood === 'good' || log.mood === 'great');
}

/** Pick the storefront: food fights cravings during menstrual days, boutique otherwise. */
export function pickStorefront(prediction: Prediction): Storefront {
  return capacityPhaseFor(prediction) === 'menstrual' ? 'food' : 'boutique';
}

/**
 * Only with OS permission she already gave (never prompts from here), and
 * only within her notification choices, quiet hours and the daily cap.
 */
async function canNotify(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return false;
  return claimExtraSlot();
}

/** "70% off tonight" nudge — fires immediately when the rough patch is detected. */
export async function notifyFlashSale(storefront: Storefront): Promise<void> {
  if (!(await canNotify())) return;
  const meta = STOREFRONT_META[storefront];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${meta.emoji} Just for tonight: 70% off at ${meta.title}`,
      body:
        storefront === 'boutique'
          ? 'Your cart is waiting, gorgeous. Treat yourself — on us.'
          : 'The comfort menu is open. Order what the craving wants.',
    },
    trigger: null, // now
  });
}

/** Gentle goodbye when an order dissolves. */
export async function notifyDissolved(storefront: Storefront): Promise<void> {
  if (!(await canNotify())) return;
  const meta = STOREFRONT_META[storefront];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🕊️ Your ${meta.title} order floated away`,
      body: 'Funny how the craving did too. It served its purpose.',
    },
    trigger: null,
  });
}

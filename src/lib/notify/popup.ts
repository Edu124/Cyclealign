import type { LedgerItem } from '@/lib/stores/useNotificationLedger';
import { isQuietNow } from './decide';
import type { NotificationConfig } from './library';
import { todayISO } from '@/lib/dates';

/** After she taps a push, no pop-up for a while (cross-channel de-duplication). */
export const TAP_SUPPRESS_MS = 10 * 60_000;
const TYPE_ORDER = ['daily_guidance', 'period_confirmation', 'symptom_checkin'];

/**
 * Today's eligible in-app message, if any: its time has come, it was not
 * already delivered as a background push, and she has not opened or
 * dismissed it. Never during quiet hours, never right after a push tap.
 */
export function pickPopupItem(
  items: Record<string, LedgerItem>,
  now: Date,
  lastTapAt: number | null,
  config: NotificationConfig,
): LedgerItem | null {
  if (isQuietNow(now, config)) return null;
  if (lastTapAt && now.getTime() - lastTapAt < TAP_SUPPRESS_MS) return null;
  const today = todayISO(now);
  const eligible = Object.values(items).filter(
    (i) =>
      i.localDate === today &&
      i.at <= now.getTime() &&
      (i.status === 'planned' || i.status === 'sent') &&
      (!i.pushScheduled || !!i.receivedForeground),
  );
  eligible.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
  return eligible[0] ?? null;
}

import { useEffect } from 'react';
import type { Prediction } from '@/types/models';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useSettings } from '@/lib/stores/useSettings';
import {
  cooldownOver,
  saleIsLive,
  useRetailTherapy,
} from '@/lib/stores/useRetailTherapy';
import { todayISO } from '@/lib/dates';
import {
  isRoughPatch,
  isStabilised,
  notifyDissolved,
  notifyFlashSale,
  pickStorefront,
} from './engine';

/**
 * Call once on the Today screen. Reacts to the day's Quick Log:
 *  - rough patch detected  → open a flash sale + push the nudge
 *  - mood stabilised       → dissolve active impulse orders early
 *  - always                → dissolve orders older than 3 days
 */
export function useRetailTherapyTrigger(prediction: Prediction | null) {
  const retailTherapy = useSettings((s) => s.retailTherapy);
  const todayLog = useDailyLog((s) => s.logs[todayISO()]);
  const { saleEndsAt, lastTriggerAt, startSale, dissolveOrders } = useRetailTherapy();

  useEffect(() => {
    // Time-based dissolve runs regardless of settings — orders must never linger.
    const expired = dissolveOrders(false);
    expired.forEach((o) => notifyDissolved(o.storefront).catch(() => {}));
  }, []);

  useEffect(() => {
    if (!prediction || !todayLog) return;

    if (isStabilised(todayLog)) {
      const dissolved = dissolveOrders(true);
      dissolved.forEach((o) => notifyDissolved(o.storefront).catch(() => {}));
      return;
    }

    if (
      retailTherapy &&
      isRoughPatch(prediction, todayLog) &&
      !saleIsLive(saleEndsAt) &&
      cooldownOver(lastTriggerAt)
    ) {
      const storefront = pickStorefront(prediction);
      startSale(storefront);
      notifyFlashSale(storefront).catch(() => {});
    }
  }, [todayLog?.energy, todayLog?.mood, prediction?.dayOfCycle, retailTherapy]);
}

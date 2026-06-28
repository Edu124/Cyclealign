import { useMemo } from 'react';
import { predictionEngine } from '@/lib/prediction/engine';
import { selectLastPeriodStart, useAppStore } from '@/lib/stores/useAppStore';
import { Prediction } from '@/types/models';

/**
 * Derives the current prediction from the persisted profile + cycle logs.
 * Returns null until the user has both a profile and at least one logged period.
 */
export function usePrediction(now: Date = new Date()): Prediction | null {
  const profile = useAppStore((s) => s.profile);
  const lastPeriodStart = useAppStore(selectLastPeriodStart);
  const cycleLogs = useAppStore((s) => s.cycleLogs);

  return useMemo(() => {
    if (!profile || !lastPeriodStart) return null;
    return predictionEngine.predict({
      lastPeriodStart,
      avgCycleLength: profile.avgCycleLength,
      avgPeriodLength: profile.avgPeriodLength,
      history: cycleLogs,
      now,
    });
    // now is intentionally captured once per render; callers pass a stable value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, lastPeriodStart, cycleLogs, now.toDateString()]);
}

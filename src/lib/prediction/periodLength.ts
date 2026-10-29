import type { CycleLog } from '@/types/models';
import { daysBetween, fromISODate } from '@/lib/dates';

/** The prediction engine supports periods of 2–10 days. */
export const MIN_PERIOD_DAYS = 2;
export const MAX_PERIOD_DAYS = 10;

/**
 * Typical period length from the periods she has actually marked (start and
 * end), averaging the latest three. Falls back to `fallback` — her onboarding
 * answer — when no period has an end date yet.
 */
export function periodLengthFromLogs(logs: CycleLog[], fallback: number): number {
  const lengths = [...logs]
    .filter((l) => l.startDate && l.endDate)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
    .slice(0, 3)
    .map((l) => daysBetween(fromISODate(l.startDate), fromISODate(l.endDate as string)) + 1)
    .filter((n) => n >= 1 && n <= 20);
  if (lengths.length === 0) return fallback;
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  return Math.max(MIN_PERIOD_DAYS, Math.min(avg, MAX_PERIOD_DAYS));
}

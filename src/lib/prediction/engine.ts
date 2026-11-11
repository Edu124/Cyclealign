import { CycleLog, DateRange, Prediction } from '@/types/models';
import {
  addDaysISO,
  daysBetween,
  fromISODate,
  todayISO,
} from '@/lib/dates';
import { phaseForDay } from './phases';

export interface PredictInput {
  /** First day of the most recent period (ISO date). */
  lastPeriodStart: string;
  avgCycleLength: number;
  avgPeriodLength: number;
  /** Optional history of past period starts to refine the cycle estimate. */
  history?: CycleLog[];
  /** Override "today" — primarily for deterministic tests. */
  now?: Date;
}

export interface PredictionEngine {
  predict(input: PredictInput): Prediction;
}

/**
 * Data-entry range for a cycle (first day of one period to the first day of
 * the next). Wide on purpose: 15–90 days is what the app accepts, not a claim
 * about what is medically typical.
 */
export const MIN_CYCLE = 15;
export const MAX_CYCLE = 90;
/** Period duration the app accepts (1–15 days). */
export const MIN_PERIOD = 1;
export const MAX_PERIOD = 15;
/** Completed cycles used for the typical length. */
const RECENT_CYCLES = 6;

function clampCycle(value: number): number {
  if (!Number.isFinite(value)) return 28;
  return Math.round(Math.min(MAX_CYCLE, Math.max(MIN_CYCLE, value)));
}

export function clampPeriod(value: number | null | undefined): number {
  if (!value || !Number.isFinite(value)) return 5;
  return Math.round(Math.max(MIN_PERIOD, Math.min(value, MAX_PERIOD)));
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface CycleStats {
  /** Every completed cycle, oldest first, exactly as logged (never averaged away). */
  lengths: number[];
  /** Median of the most recent completed cycles; null until there are two. */
  typical: number | null;
  min: number | null;
  max: number | null;
  /** max - min across the recent cycles. */
  spread: number;
}

/**
 * Completed cycle lengths = days between consecutive logged period starts.
 * Gaps outside the accepted range (a missed or duplicate log) are left out.
 */
export function cycleStats(history?: Pick<CycleLog, 'startDate'>[]): CycleStats {
  const starts = Array.from(new Set((history ?? []).map((c) => c.startDate).filter(Boolean))).sort();
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const gap = daysBetween(fromISODate(starts[i - 1]), fromISODate(starts[i]));
    if (gap >= MIN_CYCLE && gap <= MAX_CYCLE) lengths.push(gap);
  }
  const recent = lengths.slice(-RECENT_CYCLES);
  if (recent.length < 2) {
    return { lengths, typical: null, min: recent[0] ?? null, max: recent[0] ?? null, spread: 0 };
  }
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  return { lengths, typical: Math.round(median(recent)), min, max, spread: max - min };
}

/**
 * Effective cycle length for estimates. With two or more completed cycles we
 * use the MEDIAN of the recent ones (robust to one unusual month) — never a
 * guarantee, and the real lengths stay in history. Otherwise her own answer.
 */
export function effectiveCycleLength(
  avgCycleLength: number,
  history?: CycleLog[],
): number {
  // Require at least 3 logged starts (= 2 real gaps) before trusting history.
  // A single gap between 2 logs is too noisy — e.g. the onboarding date + one
  // new log gives a gap equal to however long ago onboarding was.
  const stats = cycleStats(history);
  if (stats.typical !== null) return clampCycle(stats.typical);
  return clampCycle(avgCycleLength);
}

/**
 * Pure, on-device statistical prediction. No network, no stored predictions —
 * everything is derived from the last period start + cycle/period lengths.
 */
export class LocalStatisticalEngine implements PredictionEngine {
  predict(input: PredictInput): Prediction {
    const now = input.now ?? new Date();
    const today = todayISO(now);

    const cycleLength = effectiveCycleLength(
      input.avgCycleLength,
      input.history,
    );
    const stats = cycleStats(input.history);
    const periodLength = clampPeriod(input.avgPeriodLength);

    // Roll the "cycle start" forward until it is the cycle that contains today.
    let cycleStart = input.lastPeriodStart;
    let elapsed = daysBetween(fromISODate(cycleStart), fromISODate(today));
    // Detect overdue BEFORE rolling: today has passed the expected next period
    // start but the user hasn't logged a new period yet. Per spec: expose this
    // flag so the UI can prompt — never auto-reset the cycle silently.
    // NOTE: elapsed === cycleLength means today IS the due date, not "past" it —
    // use strict > so we don't roll one extra cycle on the exact due day.
    const isOverdue = elapsed >= cycleLength;
    while (elapsed > cycleLength) {
      cycleStart = addDaysISO(cycleStart, cycleLength);
      elapsed -= cycleLength;
    }
    // Guard against a future-dated lastPeriodStart.
    if (elapsed < 0) elapsed = 0;

    // Cap at cycleLength: on the exact due day elapsed === cycleLength → day 1 of new cycle.
    const dayOfCycle = Math.min(elapsed + 1, cycleLength); // 1-based
    const nextPeriodStart = addDaysISO(cycleStart, cycleLength);
    const daysUntilNextPeriod = daysBetween(
      fromISODate(today),
      fromISODate(nextPeriodStart),
    );

    // Ovulation ~14 days before the next period.
    const ovulationDate = addDaysISO(nextPeriodStart, -14);
    // Fertile window: 5 days before ovulation through 1 day after.
    const fertileWindow: DateRange = {
      start: addDaysISO(ovulationDate, -5),
      end: addDaysISO(ovulationDate, 1),
    };

    const periodWindow: DateRange = {
      start: cycleStart,
      end: addDaysISO(cycleStart, periodLength - 1),
    };

    const currentPhase = phaseForDay(dayOfCycle, cycleLength, periodLength);

    return {
      dayOfCycle,
      cycleLength,
      currentPhase,
      nextPeriodStart,
      daysUntilNextPeriod,
      ovulationDate,
      fertileWindow,
      periodWindow,
      isOverdue,
      ...(stats.typical !== null && {
        cycleRange: { min: stats.min!, max: stats.max!, typical: stats.typical, count: stats.lengths.length },
      }),
    };
  }
}

/** Default engine instance used across the app. */
export const predictionEngine: PredictionEngine = new LocalStatisticalEngine();

export function predict(input: PredictInput): Prediction {
  return predictionEngine.predict(input);
}

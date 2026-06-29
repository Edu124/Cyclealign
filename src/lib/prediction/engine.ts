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

const MIN_CYCLE = 21;
const MAX_CYCLE = 45;

function clampCycle(value: number): number {
  if (Number.isNaN(value)) return 28;
  return Math.round(Math.min(MAX_CYCLE, Math.max(MIN_CYCLE, value)));
}

/**
 * Derive an effective cycle length. When two or more historical period starts
 * exist we average the real gaps between them (more accurate than the user's
 * self-reported average); otherwise we fall back to the provided average.
 */
export function effectiveCycleLength(
  avgCycleLength: number,
  history?: CycleLog[],
): number {
  const starts = (history ?? [])
    .map((c) => c.startDate)
    .filter(Boolean)
    .sort();

  if (starts.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < starts.length; i++) {
      const gap = daysBetween(fromISODate(starts[i - 1]), fromISODate(starts[i]));
      if (gap >= MIN_CYCLE && gap <= MAX_CYCLE) gaps.push(gap);
    }
    if (gaps.length > 0) {
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      return clampCycle(mean);
    }
  }
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
    const periodLength = Math.max(2, Math.min(input.avgPeriodLength || 5, 10));

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
    };
  }
}

/** Default engine instance used across the app. */
export const predictionEngine: PredictionEngine = new LocalStatisticalEngine();

export function predict(input: PredictInput): Prediction {
  return predictionEngine.predict(input);
}

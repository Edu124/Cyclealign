import { format } from 'date-fns';
import { PhaseKey, Prediction } from '@/types/models';
import {
  addDaysISO,
  daysBetween,
  fromISODate,
  todayISO,
} from '@/lib/dates';
import { phaseForDay } from '@/lib/prediction/phases';
import { getPhases } from '@/lib/prediction/phases';
import {
  ACTIVITY_WINDOWS,
  PHASE_STRATEGY,
  PhaseStrategy,
  strategyForPhase,
} from './framework';

/**
 * The scheduling-intelligence engine. Pure functions that turn a Prediction
 * into today / this-week / this-month leadership guidance. All projection is
 * derived from the current cycle's anchor (period start) + cycle length, so it
 * works offline and for any past or future date.
 */

function periodLengthOf(prediction: Prediction): number {
  return (
    daysBetween(
      fromISODate(prediction.periodWindow.start),
      fromISODate(prediction.periodWindow.end),
    ) + 1
  );
}

/** Project the phase for ANY date from a known cycle anchor. */
export function phaseForDate(
  dateISO: string,
  anchorStartISO: string,
  cycleLength: number,
  periodLength: number,
): PhaseKey {
  const elapsed = daysBetween(fromISODate(anchorStartISO), fromISODate(dateISO));
  const mod = ((elapsed % cycleLength) + cycleLength) % cycleLength;
  return phaseForDay(mod + 1, cycleLength, periodLength);
}

/** Convenience: phase for a date using values carried on a Prediction. */
export function phaseForDateFromPrediction(
  prediction: Prediction,
  dateISO: string,
): PhaseKey {
  return phaseForDate(
    dateISO,
    prediction.periodWindow.start,
    prediction.cycleLength,
    periodLengthOf(prediction),
  );
}

export interface DailyBriefing {
  dateISO: string;
  dayOfCycle: number;
  phase: PhaseKey;
  strategy: PhaseStrategy;
}

export function dailyBriefing(
  prediction: Prediction,
  role?: string | null,
  now: Date = new Date(),
): DailyBriefing {
  return {
    dateISO: todayISO(now),
    dayOfCycle: prediction.dayOfCycle,
    phase: prediction.currentPhase,
    strategy: strategyForPhase(prediction.currentPhase, role),
  };
}

export interface DayOutlook {
  dateISO: string;
  weekday: string; // "Mon"
  dayLabel: string; // "5"
  dayOfCycle: number;
  phase: PhaseKey;
  theme: string;
  isToday: boolean;
}

export function weekOutlook(
  prediction: Prediction,
  now: Date = new Date(),
  days = 7,
): DayOutlook[] {
  const anchor = prediction.periodWindow.start;
  const cycleLength = prediction.cycleLength;
  const periodLength = periodLengthOf(prediction);
  const today = todayISO(now);

  const out: DayOutlook[] = [];
  for (let i = 0; i < days; i++) {
    const dateISO = addDaysISO(today, i);
    const elapsed = daysBetween(fromISODate(anchor), fromISODate(dateISO));
    const mod = ((elapsed % cycleLength) + cycleLength) % cycleLength;
    const dayOfCycle = mod + 1;
    const phase = phaseForDay(dayOfCycle, cycleLength, periodLength);
    const d = fromISODate(dateISO);
    out.push({
      dateISO,
      weekday: format(d, 'EEE'),
      dayLabel: format(d, 'd'),
      dayOfCycle,
      phase,
      theme: PHASE_STRATEGY[phase].theme,
      isToday: i === 0,
    });
  }
  return out;
}

export interface PhaseWindow {
  phase: PhaseKey;
  theme: string;
  start: string; // ISO
  end: string; // ISO
}

/** Date ranges for each phase within the current cycle. */
export function cyclePhaseWindows(prediction: Prediction): PhaseWindow[] {
  const anchor = prediction.periodWindow.start;
  const periodLength = periodLengthOf(prediction);
  return getPhases(prediction.cycleLength, periodLength).map((p) => ({
    phase: p.key,
    theme: PHASE_STRATEGY[p.key].theme,
    start: addDaysISO(anchor, p.range[0] - 1),
    end: addDaysISO(anchor, p.range[1] - 1),
  }));
}

export interface RecommendedWindow {
  activity: string;
  phase: PhaseKey;
  theme: string;
  start: string;
  end: string;
}

/** Roll a window forward whole cycles until it ends on/after today. */
function nextOccurrence(
  startISO: string,
  endISO: string,
  cycleLength: number,
  today: string,
): { start: string; end: string } {
  let s = startISO;
  let e = endISO;
  let guard = 0;
  while (daysBetween(fromISODate(today), fromISODate(e)) < 0 && guard < 24) {
    s = addDaysISO(s, cycleLength);
    e = addDaysISO(e, cycleLength);
    guard++;
  }
  return { start: s, end: e };
}

/** The "plan around your cycle" windows — each the NEXT upcoming occurrence. */
export function recommendedWindows(
  prediction: Prediction,
  now: Date = new Date(),
): RecommendedWindow[] {
  const today = todayISO(now);
  const windows = cyclePhaseWindows(prediction);
  return ACTIVITY_WINDOWS.map((a) => {
    const w = windows.find((x) => x.phase === a.phase)!;
    const occ = nextOccurrence(w.start, w.end, prediction.cycleLength, today);
    return {
      activity: a.activity,
      phase: a.phase,
      theme: w.theme,
      start: occ.start,
      end: occ.end,
    };
  }).sort((x, y) => (x.start < y.start ? -1 : 1));
}

export function monthPlan(prediction: Prediction, now: Date = new Date()) {
  return {
    phaseWindows: cyclePhaseWindows(prediction),
    recommendedWindows: recommendedWindows(prediction, now),
  };
}

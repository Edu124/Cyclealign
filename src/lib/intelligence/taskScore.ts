import { Prediction } from '@/types/models';
import { addDaysISO, daysBetween, fromISODate, todayISO } from '@/lib/dates';
import {
  CapacityPhase,
  capacityPhaseFromDay,
  periodLengthOf,
} from './capacity';
import { IconName } from '@/components/dashboard/Icon';

/**
 * Task Sync (Section 4). Privacy-first: the user selects a CATEGORY only — never
 * types the task name. The category + selected date are scored against the phase
 * she'll be in on that date.
 */

export type ScoreColor = 'green' | 'amber' | 'red';

export interface TaskSyncCategory {
  id: string;
  label: string;
  icon: IconName;
}

export const TASK_SYNC_CATEGORIES: TaskSyncCategory[] = [
  { id: 'HIGH_CONVO', label: 'High stakes conversation', icon: 'chat' },
  { id: 'DECISION', label: 'Decision making / planning', icon: 'bolt' },
  { id: 'DEEP_FOCUS', label: 'Deep focus / creative work', icon: 'pencil' },
  { id: 'MEETING', label: 'Meeting or call', icon: 'phone' },
  { id: 'ADMIN', label: 'Admin / paperwork', icon: 'document' },
  { id: 'PERSONAL', label: 'Personal / sensitive', icon: 'lock' },
  { id: 'OTHER', label: 'Other', icon: 'grid' },
];

export function categoryById(id: string): TaskSyncCategory | undefined {
  return TASK_SYNC_CATEGORIES.find((c) => c.id === id);
}

/** Score matrix (4.2). `null` = no score (Personal/Sensitive). */
export const SCORE_MATRIX: Record<
  string,
  Record<CapacityPhase, ScoreColor | null>
> = {
  HIGH_CONVO: {
    menstrual: 'red',
    follicular: 'amber',
    ovulatory: 'green',
    luteal_early: 'amber',
    luteal_late: 'red',
  },
  DECISION: {
    menstrual: 'red',
    follicular: 'green',
    ovulatory: 'green',
    luteal_early: 'amber',
    luteal_late: 'red',
  },
  DEEP_FOCUS: {
    menstrual: 'amber',
    follicular: 'green',
    ovulatory: 'amber',
    luteal_early: 'green',
    luteal_late: 'amber',
  },
  MEETING: {
    menstrual: 'amber',
    follicular: 'green',
    ovulatory: 'green',
    luteal_early: 'green',
    luteal_late: 'amber',
  },
  ADMIN: {
    menstrual: 'green',
    follicular: 'green',
    ovulatory: 'green',
    luteal_early: 'green',
    luteal_late: 'green',
  },
  PERSONAL: {
    menstrual: null,
    follicular: null,
    ovulatory: null,
    luteal_early: null,
    luteal_late: null,
  },
  OTHER: {
    menstrual: 'amber',
    follicular: 'green',
    ovulatory: 'green',
    luteal_early: 'green',
    luteal_late: 'amber',
  },
};

/** Capacity phase the user will be in on a given date (projected). */
export function phaseForDate(
  dateISO: string,
  prediction: Prediction,
): CapacityPhase {
  const anchor = prediction.periodWindow.start;
  const L = prediction.cycleLength;
  const P = periodLengthOf(prediction);
  const elapsed = daysBetween(fromISODate(anchor), fromISODate(dateISO));
  const dayOfCycle = ((elapsed % L) + L) % L + 1;
  return capacityPhaseFromDay(dayOfCycle, L, P);
}

export interface TaskScoreResult {
  phase: CapacityPhase;
  score: ScoreColor | null; // null = Personal/Sensitive
}

export function scoreForDate(
  categoryId: string,
  dateISO: string,
  prediction: Prediction,
): TaskScoreResult {
  const phase = phaseForDate(dateISO, prediction);
  const score = SCORE_MATRIX[categoryId]?.[phase] ?? null;
  return { phase, score };
}

/** Next `days` dates (from today, exclusive of today by default) that score green. */
export function greenDates(
  categoryId: string,
  prediction: Prediction,
  days = 30,
  now: Date = new Date(),
): string[] {
  const start = todayISO(now);
  const out: string[] = [];
  for (let i = 1; i <= days; i++) {
    const dateISO = addDaysISO(start, i);
    if (scoreForDate(categoryId, dateISO, prediction).score === 'green') {
      out.push(dateISO);
    }
  }
  return out;
}

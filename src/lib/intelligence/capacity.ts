import { Prediction } from '@/types/models';
import { getPhases } from '@/lib/prediction/phases';
import { daysBetween, fromISODate } from '@/lib/dates';
import type { IconName } from '@/components/dashboard/Icon';

/**
 * Capacity model (V1) — maps the biological cycle phase (plus an early/late
 * split of the luteal phase) to a daily "capacity" and hardcoded guidance.
 * Per spec, this changes copy/labels only; phase calculations are unchanged.
 */

export type CapacityPhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal_early'
  | 'luteal_late';

export type Capacity = 'HIGH' | 'MEDIUM' | 'LOW';

export const CAPACITY: Record<CapacityPhase, Capacity> = {
  menstrual: 'LOW',
  follicular: 'HIGH',
  ovulatory: 'HIGH',
  luteal_early: 'MEDIUM',
  luteal_late: 'LOW',
};

export interface Guidance {
  bestFor: string;
  useWisely: string;
  defer: string;
}

/** Component C content — hardcoded per phase in V1 (client's table). */
export const GUIDANCE: Record<CapacityPhase, Guidance> = {
  menstrual: {
    bestFor: 'Rest, reflection, admin',
    useWisely: 'Only urgent tasks',
    defer: 'Big decisions, presentations',
  },
  follicular: {
    bestFor: 'Ideation, planning, learning',
    useWisely: 'Creative output first',
    defer: 'Routine admin',
  },
  ovulatory: {
    bestFor: 'Pitching, negotiating, presenting',
    useWisely: 'High-stakes conversations',
    defer: 'Detail work, admin',
  },
  luteal_early: {
    bestFor: 'Auditing, detail work, organising',
    useWisely: 'Focus in the morning',
    defer: 'New initiatives',
  },
  luteal_late: {
    bestFor: 'Wrapping up, self-care',
    useWisely: 'Light tasks only',
    defer: 'High-stakes decisions',
  },
};

function periodLengthOf(prediction: Prediction): number {
  return (
    daysBetween(
      fromISODate(prediction.periodWindow.start),
      fromISODate(prediction.periodWindow.end),
    ) + 1
  );
}

/** Capacity phase for any 1-based day-of-cycle (splits luteal early/late). */
export function capacityPhaseFromDay(
  dayOfCycle: number,
  cycleLength: number,
  periodLength: number,
): CapacityPhase {
  const phases = getPhases(cycleLength, periodLength);
  for (const ph of phases) {
    if (dayOfCycle >= ph.range[0] && dayOfCycle <= ph.range[1]) {
      if (ph.key === 'menstrual') return 'menstrual';
      if (ph.key === 'follicular') return 'follicular';
      if (ph.key === 'ovulation') return 'ovulatory';
      const mid = (ph.range[0] + ph.range[1]) / 2;
      return dayOfCycle <= mid ? 'luteal_early' : 'luteal_late';
    }
  }
  return 'luteal_late';
}

/** Derive today's capacity phase from the live prediction. */
export function capacityPhaseFor(prediction: Prediction): CapacityPhase {
  return capacityPhaseFromDay(
    prediction.dayOfCycle,
    prediction.cycleLength,
    periodLengthOf(prediction),
  );
}

export { periodLengthOf };

/** Human phase names used in Task Sync result copy. */
export const CAPACITY_PHASE_LABEL: Record<CapacityPhase, string> = {
  menstrual: 'your Menstrual phase',
  follicular: 'your Follicular phase',
  ovulatory: 'your Ovulatory phase',
  luteal_early: 'your early Luteal phase',
  luteal_late: 'your late Luteal phase',
};

/** One-line phase context (used for Personal/Sensitive guidance). */
export const PHASE_CONTEXT: Record<CapacityPhase, string> = {
  menstrual: 'a lower-energy, reflective window',
  follicular: 'a rising-energy, creative window',
  ovulatory: 'your peak, high-visibility window',
  luteal_early: 'a focused, detail-oriented window',
  luteal_late: 'a winding-down window where gentleness works best',
};

/** Short note under the big energy label (Home hero). */
export const ENERGY_NOTE: Record<Capacity, string> = {
  HIGH: 'Make the most of today',
  MEDIUM: 'Steady energy — pace yourself',
  LOW: 'Conserve energy today',
};

/** The 3 mini guidance items on the energy hero (Focus on / Good for / Avoid). */
export interface HeroGuidance {
  focus: string;
  goodFor: string;
  avoid: string;
}

export const HERO_GUIDANCE: Record<CapacityPhase, HeroGuidance> = {
  menstrual: { focus: 'Rest', goodFor: 'Reflection, Admin', avoid: 'Big decisions' },
  follicular: { focus: 'Create', goodFor: 'Ideation, Planning', avoid: 'Routine admin' },
  ovulatory: { focus: 'Connect', goodFor: 'Pitching, Meetings', avoid: 'Detail work' },
  luteal_early: { focus: 'Execute', goodFor: 'Detail, Organising', avoid: 'New initiatives' },
  luteal_late: { focus: 'Wind down', goodFor: 'Wrapping up, Self-care', avoid: 'High-stakes calls' },
};

/** Today's Focus tiles (3 per phase). */
export interface FocusTile {
  icon: IconName;
  title: string;
  subtitle: string;
  tone: 'green' | 'cream' | 'peach';
}

export const FOCUS_TILES: Record<CapacityPhase, FocusTile[]> = {
  menstrual: [
    { icon: 'leaf', title: 'Rest', subtitle: 'Recharge your body and mind', tone: 'green' },
    { icon: 'document', title: 'Reflection', subtitle: 'Journal, plan, light thinking', tone: 'cream' },
    { icon: 'briefcase', title: 'Admin Work', subtitle: 'Simple tasks, easy wins', tone: 'peach' },
  ],
  follicular: [
    { icon: 'bolt', title: 'Ideate', subtitle: 'Brainstorm and start fresh', tone: 'green' },
    { icon: 'pencil', title: 'Create', subtitle: 'Creative output first', tone: 'cream' },
    { icon: 'document', title: 'Learn', subtitle: 'Pick up new skills', tone: 'peach' },
  ],
  ovulatory: [
    { icon: 'chat', title: 'Pitch', subtitle: 'Present and persuade', tone: 'green' },
    { icon: 'phone', title: 'Connect', subtitle: 'Meetings and networking', tone: 'cream' },
    { icon: 'bolt', title: 'Decide', subtitle: 'High-stakes calls', tone: 'peach' },
  ],
  luteal_early: [
    { icon: 'document', title: 'Detail Work', subtitle: 'Audit and organise', tone: 'green' },
    { icon: 'briefcase', title: 'Finish', subtitle: 'Close out open loops', tone: 'cream' },
    { icon: 'pencil', title: 'Refine', subtitle: 'Edit and polish', tone: 'peach' },
  ],
  luteal_late: [
    { icon: 'leaf', title: 'Self-care', subtitle: 'Be gentle with yourself', tone: 'green' },
    { icon: 'document', title: 'Wrap Up', subtitle: 'Light, finishing tasks', tone: 'cream' },
    { icon: 'moon', title: 'Slow Down', subtitle: 'Protect your energy', tone: 'peach' },
  ],
};

// ---- Task scoring (Component D badges) ------------------------------------

export type TaskScore = 'good' | 'warn' | 'flag';
export type TaskDemand = 'high' | 'low';

export interface TaskCategory {
  key: string;
  label: string;
  emoji: string;
  demand: TaskDemand;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  { key: 'pitch', label: 'Pitch / Present', emoji: '🎤', demand: 'high' },
  { key: 'decision', label: 'Big decision', emoji: '⚖️', demand: 'high' },
  { key: 'deep', label: 'Deep focus work', emoji: '🧠', demand: 'high' },
  { key: 'creative', label: 'Creative work', emoji: '🎨', demand: 'high' },
  { key: 'meeting', label: 'Meeting / call', emoji: '💬', demand: 'high' },
  { key: 'admin', label: 'Admin / routine', emoji: '🗂️', demand: 'low' },
  { key: 'selfcare', label: 'Self-care', emoji: '🧘', demand: 'low' },
];

export function categoryByKey(key: string): TaskCategory | undefined {
  return TASK_CATEGORIES.find((c) => c.key === key);
}

/** Green tick / amber warning / red flag based on demand vs today's capacity. */
export function scoreTask(demand: TaskDemand, capacity: Capacity): TaskScore {
  if (demand === 'low') return 'good';
  if (capacity === 'HIGH') return 'good';
  if (capacity === 'MEDIUM') return 'warn';
  return 'flag';
}

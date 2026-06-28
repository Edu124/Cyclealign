import { PhaseKey } from '@/types/models';
import { UserRole } from '@/lib/roles';

/**
 * ============================================================================
 *  CYCLEALIGN — PHASE → LEADERSHIP FRAMEWORK   (the product's core IP)
 * ============================================================================
 *
 *  This single file holds ALL of the phase→leadership guidance copy. It is the
 *  one place to edit the "intelligence" the app surfaces.
 *
 *  CLIENT: replace the placeholder copy below with your final framework /
 *  science. Keep the SHAPE (the keys) the same — every screen reads from here,
 *  so updating wording here updates the whole app. Phase logic and calculations
 *  are identical for everyone; `byRole` only flavours wording.
 * ----------------------------------------------------------------------------
 */

export type EnergyLevel = 'low' | 'rising' | 'peak' | 'tapering';

export interface PhaseStrategy {
  /** One-word theme, e.g. "Reflect" / "Create" / "Connect" / "Execute". */
  theme: string;
  /** Headline shown in the daily briefing, e.g. "Today is a Connect day". */
  headline: string;
  /** 1–2 sentence summary of what this phase means for her work. */
  summary: string;
  /** Lean into these now. */
  bestFor: string[];
  /** Deprioritise / protect energy from these now. */
  goEasyOn: string[];
  energy: EnergyLevel;
  /** Optional per-role wording overrides (copy only — never logic). */
  byRole?: Partial<Record<UserRole, Partial<PhaseStrategy>>>;
}

export const PHASE_STRATEGY: Record<PhaseKey, PhaseStrategy> = {
  // ---- MENSTRUAL ----------------------------------------------------------
  menstrual: {
    theme: 'Reflect',
    headline: 'Today is a Reflect day',
    summary:
      'Hormones are at their lowest and your mind turns analytical. A powerful window for stepping back, reviewing, and setting direction.',
    bestFor: [
      'Reviewing results & strategy',
      'Big-picture planning',
      'Analytical, solo deep work',
      'Low-stakes admin',
    ],
    goEasyOn: [
      'High-visibility pitching',
      'Hard negotiations',
      'Packed social schedules',
    ],
    energy: 'low',
    byRole: {
      entrepreneur: { summary: 'Low hormones sharpen analysis — a strong window to review your numbers and reset strategy before the next sprint.' },
      corporate: { summary: 'Your analytical edge peaks. Ideal for reviewing the quarter and shaping your strategic point of view.' },
    },
  },

  // ---- FOLLICULAR ---------------------------------------------------------
  follicular: {
    theme: 'Create',
    headline: 'Today is a Create day',
    summary:
      'Rising estrogen lifts energy, optimism and openness to new ideas. Your brain is wired to start, learn and connect dots.',
    bestFor: [
      'Ideation & brainstorming',
      'Starting new projects',
      'Learning new skills',
      'Outreach & first conversations',
    ],
    goEasyOn: [
      'Tedious finishing work',
      'Rigid, repetitive tasks',
    ],
    energy: 'rising',
  },

  // ---- OVULATION ----------------------------------------------------------
  ovulation: {
    theme: 'Connect',
    headline: 'Today is a Connect day',
    summary:
      'Estrogen peaks: communication, confidence and charisma are at their highest. Your best window to be seen and to persuade.',
    bestFor: [
      'Pitching & presenting',
      'Negotiating',
      'Networking & interviews',
      'High-visibility meetings',
    ],
    goEasyOn: [
      'Heads-down solo deep work',
      'Big decisions made in isolation',
    ],
    energy: 'peak',
    byRole: {
      entrepreneur: { headline: 'Today is a Pitch day' },
    },
  },

  // ---- LUTEAL -------------------------------------------------------------
  luteal: {
    theme: 'Execute',
    headline: 'Today is an Execute day',
    summary:
      'Progesterone rises and attention narrows to detail. The finisher phase — ideal for completing, refining and tidying up.',
    bestFor: [
      'Finishing & shipping work',
      'Editing & detail work',
      'Organising & systems',
      'Setting boundaries',
    ],
    goEasyOn: [
      'Starting brand-new things',
      'Big social or visibility bets',
    ],
    energy: 'tapering',
  },
};

/** Activity windows surfaced in the month plan, each tied to its best phase. */
export interface ActivityWindow {
  activity: string;
  phase: PhaseKey;
}

export const ACTIVITY_WINDOWS: ActivityWindow[] = [
  { activity: 'Pitch & present', phase: 'ovulation' },
  { activity: 'Create & start', phase: 'follicular' },
  { activity: 'Execute & finish', phase: 'luteal' },
  { activity: 'Reflect & plan', phase: 'menstrual' },
];

/** Resolve a phase's strategy with any role-specific wording merged in. */
export function strategyForPhase(
  phase: PhaseKey,
  role?: string | null,
): PhaseStrategy {
  const base = PHASE_STRATEGY[phase];
  const override =
    role && base.byRole ? base.byRole[role as UserRole] : undefined;
  return override ? { ...base, ...override } : base;
}

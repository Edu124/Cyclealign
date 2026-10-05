import type { CycleLog, Profile } from '@/types/models';
import { daysBetween, fromISODate } from '@/lib/dates';
import { resolveModeFromAnswers } from '../../../supabase/functions/_shared/partnerDigest';
import type { AdaptiveMode } from './types';

/**
 * Routes a user to an engine. Anyone who has never answered the new
 * profile questions (every existing user) stays on the regular experience —
 * the adaptive layer is opt-in by answering, never forced.
 */
export function resolveMode(profile: Pick<Profile, 'cycleRegularity' | 'healthContext'> | null | undefined): AdaptiveMode {
  return resolveModeFromAnswers(profile?.cycleRegularity, profile?.healthContext);
}

/**
 * How much a calendar-phase estimate may influence recommendations.
 * 'reliable' = today's behaviour, 'partial' = a light nudge, 'none' = ignore.
 */
export type PhaseReliability = 'reliable' | 'partial' | 'none';

export function phaseReliability(
  profile: Pick<Profile, 'cycleRegularity' | 'healthContext'> | null | undefined,
  cycleLogs: Pick<CycleLog, 'startDate'>[] = [],
): PhaseReliability {
  if (resolveMode(profile) !== 'regular') return 'none';
  if (profile?.cycleRegularity === 'VARIABLE') return 'partial';

  // Even a "regular" user whose logged cycles actually swing a lot shouldn't be
  // treated as textbook — look at the real gaps once there are enough.
  const starts = cycleLogs.map((c) => c.startDate).filter(Boolean).sort();
  if (starts.length >= 4) {
    const gaps: number[] = [];
    for (let i = 1; i < starts.length; i++) {
      gaps.push(daysBetween(fromISODate(starts[i - 1]), fromISODate(starts[i])));
    }
    if (Math.max(...gaps) - Math.min(...gaps) > 10) return 'partial';
  }
  return 'reliable';
}

/** True when the app may show phase / ovulation language as context at all. */
export function mayShowPhase(mode: AdaptiveMode): boolean {
  return mode === 'regular';
}

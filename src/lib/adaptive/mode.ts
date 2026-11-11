import type { CycleLog, Profile } from '@/types/models';
import { cycleStats } from '@/lib/prediction/engine';
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

/** Days of difference between her recent cycles that count as "varies". */
export const VARIABLE_SPREAD_DAYS = 7;

export function phaseReliability(
  profile: Pick<Profile, 'cycleRegularity' | 'healthContext' | 'cycleLengthPreference'> | null | undefined,
  cycleLogs: Pick<CycleLog, 'startDate'>[] = [],
): PhaseReliability {
  if (resolveMode(profile) !== 'regular') return 'none';
  if (profile?.cycleRegularity === 'VARIABLE') return 'partial';

  // Her real history outweighs any assumption: once there are two completed
  // cycles, cycles that differ by a week or more are treated as variable.
  const stats = cycleStats(cycleLogs);
  if (stats.typical !== null) return stats.spread >= VARIABLE_SPREAD_DAYS ? 'partial' : 'reliable';

  // Not enough history yet, and she told us her cycle varies or she isn't
  // sure: no confident phase claims until her own logs say otherwise.
  const pref = profile?.cycleLengthPreference;
  if (pref === 'varies' || pref === 'unsure') return 'partial';
  return 'reliable';
}

/** True when the app may show phase / ovulation language as context at all. */
export function mayShowPhase(mode: AdaptiveMode): boolean {
  return mode === 'regular';
}

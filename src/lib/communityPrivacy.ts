import type { PhaseKey } from '@/types/models';
import type { AdaptiveMode } from '@/lib/adaptive/types';

/**
 * Community never discloses health state on its own. A post carries her cycle
 * phase only when she switches that on for that one post, and never for
 * irregular / perimenopause users (their phase is not something we state).
 * Cycle DAY is never attached at all.
 */
export function phaseToShare(args: {
  optedIn: boolean;
  mode: AdaptiveMode;
  phase: PhaseKey | null | undefined;
}): PhaseKey | null {
  if (!args.optedIn) return null;
  if (args.mode !== 'regular') return null;
  return args.phase ?? null;
}

/**
 * The `share_phase` column comes from migration 0013 (applied), which also strips
 * phase data from older posts and, server-side, from any post that doesn't opt in.
 */
export const COMMUNITY_SHARE_PHASE_COLUMN: boolean = true;

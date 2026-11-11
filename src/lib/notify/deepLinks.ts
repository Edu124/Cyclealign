import type { PhaseKey } from '@/types/models';
import type { LinkKey } from './library';

/**
 * Turns a notification's link key into a validated in-app route. Only routes
 * in this table can ever be opened from a notification; anything else (an
 * unknown key, a tampered payload, a route removed in a later version) falls
 * back to the home screen.
 */

export const SAFE_HOME = '/(tabs)/today';
const SIGNED_OUT = '/';

const PHASES: PhaseKey[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];

export function routeForLink(link: string | undefined, phase: PhaseKey | null, hasPeriodDate: boolean): string {
  switch (link) {
    case 'today':
      return SAFE_HOME;
    case 'comfort_tips':
      return '/nutrition/menstrual';
    case 'mood_checkin':
      return '/check-in';
    case 'daily_planner':
      return '/(tabs)/plan';
    case 'cycle_overview':
      return '/(tabs)/phases';
    case 'prep_tips':
      return '/nutrition/luteal';
    case 'snack_ideas':
    case 'nutrition':
      return '/nutrition';
    case 'nutrition_phase':
      return phase && PHASES.includes(phase) ? `/nutrition/${phase}` : '/nutrition';
    case 'cycle_setup':
      // No period on record yet → the setup step; otherwise open the date editor.
      return hasPeriodDate ? `${SAFE_HOME}?editPeriod=1` : '/onboarding/cycle';
    default:
      return SAFE_HOME;
  }
}

export interface TapContext {
  signedIn: boolean;
  todayISO: string;
  phase: PhaseKey | null;
  hasPeriodDate: boolean;
}

export interface TapResult {
  route: string;
  /** Shown on arrival when the notification was from an earlier day. */
  notice: string | null;
}

export const OUTDATED_NOTICE =
  'That notification was from an earlier day, so here is your guidance for today instead.';

/** Where a tapped notification should take her, with safe fallbacks. */
export function resolveTap(
  data: { link?: unknown; localDate?: unknown } | null | undefined,
  ctx: TapContext,
): TapResult {
  if (!ctx.signedIn) return { route: SIGNED_OUT, notice: null };
  const localDate = typeof data?.localDate === 'string' ? data.localDate : null;
  // An old notification never shows yesterday's advice as current.
  if (localDate && localDate < ctx.todayISO) return { route: SAFE_HOME, notice: OUTDATED_NOTICE };
  const link = typeof data?.link === 'string' ? data.link : undefined;
  return { route: routeForLink(link as LinkKey | undefined, ctx.phase, ctx.hasPeriodDate), notice: null };
}

import type { Profile, RhythmPreference } from '@/types/models';
import { clampPeriod, MAX_CYCLE, MIN_CYCLE } from '@/lib/prediction/engine';

/**
 * The engine needs a working number even when she doesn't know her cycle or
 * period length. These are only placeholders for the maths (the database's
 * own column defaults) — they are never shown or used as her answer, and
 * with no history the app lowers its confidence and gives general guidance.
 */
export const WORKING_CYCLE_DEFAULT = 28;
export const WORKING_PERIOD_DEFAULT = 5;

export interface RhythmAnswers {
  avgCycleLength: number;
  avgPeriodLength: number;
  cycleLengthPreference: RhythmPreference;
  periodDurationPreference: RhythmPreference;
}

/** Turns the rhythm answers into profile fields. Her number is kept only for "I know". */
export function rhythmToProfile(a: RhythmAnswers): Pick<
  Profile,
  'avgCycleLength' | 'avgPeriodLength' | 'cycleLengthPreference' | 'periodDurationPreference'
> {
  const cycleKnown = a.cycleLengthPreference === 'known';
  const periodKnown = a.periodDurationPreference === 'known';
  return {
    avgCycleLength: cycleKnown
      ? Math.round(Math.min(MAX_CYCLE, Math.max(MIN_CYCLE, a.avgCycleLength)))
      : WORKING_CYCLE_DEFAULT,
    avgPeriodLength: periodKnown ? clampPeriod(a.avgPeriodLength) : WORKING_PERIOD_DEFAULT,
    cycleLengthPreference: a.cycleLengthPreference,
    periodDurationPreference: a.periodDurationPreference,
  };
}

/** Her own cycle length, or null when she said it varies / she isn't sure. Existing users count as known. */
export function reportedCycleLength(p: Pick<Profile, 'avgCycleLength' | 'cycleLengthPreference'>): number | null {
  return !p.cycleLengthPreference || p.cycleLengthPreference === 'known' ? p.avgCycleLength : null;
}

export function reportedPeriodLength(p: Pick<Profile, 'avgPeriodLength' | 'periodDurationPreference'>): number | null {
  return !p.periodDurationPreference || p.periodDurationPreference === 'known' ? p.avgPeriodLength : null;
}

const PREF_LABEL: Record<RhythmPreference, string> = { known: '', varies: 'Varies', unsure: 'Not sure yet' };

export function cycleLengthLabel(p: Pick<Profile, 'avgCycleLength' | 'cycleLengthPreference'>): string {
  const n = reportedCycleLength(p);
  return n !== null ? `${n} days` : PREF_LABEL[p.cycleLengthPreference!];
}

export function periodLengthLabel(p: Pick<Profile, 'avgPeriodLength' | 'periodDurationPreference'>): string {
  const n = reportedPeriodLength(p);
  return n !== null ? `${n} ${n === 1 ? 'day' : 'days'}` : PREF_LABEL[p.periodDurationPreference!];
}

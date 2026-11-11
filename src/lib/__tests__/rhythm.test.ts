/**
 * Cycle-Aware Productivity onboarding — acceptance tests (developer artifact §6).
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/lib/supabase', () => ({ isSupabaseConfigured: false, supabase: {} }));
jest.mock('@/lib/sync', () => ({
  pushProfile: jest.fn(async () => undefined),
  pushCycleLog: jest.fn(async () => undefined),
  updateCycleLogDate: jest.fn(async () => undefined),
  isMissingColumn: jest.requireActual('@/lib/sync').isMissingColumn,
}));

import { addDaysISO } from '@/lib/dates';
import type { CycleLog, Profile } from '@/types/models';
import { cycleStats, effectiveCycleLength, MAX_CYCLE, MIN_CYCLE, predict } from '@/lib/prediction/engine';
import { getPhases, phaseForDay } from '@/lib/prediction/phases';
import { phaseReliability } from '@/lib/adaptive/mode';
import { cycleLengthLabel, periodLengthLabel, reportedCycleLength, rhythmToProfile } from '@/lib/rhythm';
import { useAppStore } from '@/lib/stores/useAppStore';
import { buildPlan } from '@/lib/notify/decide';
import { BUNDLED_LIBRARY } from '@/lib/notify/library';
import { isMissingColumn } from '@/lib/sync';
import { parseFlags } from '@/lib/featureFlags';

const NOW = new Date(2026, 10, 11, 7, 0);
const TODAY = '2026-11-11';
const logs = (...starts: string[]): CycleLog[] => starts.map((s, i) => ({ id: String(i), userId: 'u', startDate: s }));

const answers = (over: Partial<Parameters<typeof rhythmToProfile>[0]> = {}) => ({
  avgCycleLength: 28,
  avgPeriodLength: 5,
  cycleLengthPreference: 'known' as const,
  periodDurationPreference: 'known' as const,
  ...over,
});

describe('saving cycle lengths across the 15–90 day range', () => {
  it.each([21, 24, 28, 30, 35, 45, 60])('saves and uses a %i-day cycle unchanged', (n) => {
    const p = rhythmToProfile(answers({ avgCycleLength: n }));
    expect(p.avgCycleLength).toBe(n);
    expect(effectiveCycleLength(p.avgCycleLength)).toBe(n);
    const pred = predict({ lastPeriodStart: addDaysISO(TODAY, -3), avgCycleLength: n, avgPeriodLength: 5, now: NOW });
    expect(pred.cycleLength).toBe(n);
    expect(pred.nextPeriodStart).toBe(addDaysISO(addDaysISO(TODAY, -3), n));
  });

  it('accepts the ends of the entry range and nothing beyond', () => {
    expect(MIN_CYCLE).toBe(15);
    expect(MAX_CYCLE).toBe(90);
    expect(rhythmToProfile(answers({ avgCycleLength: 15 })).avgCycleLength).toBe(15);
    expect(rhythmToProfile(answers({ avgCycleLength: 90 })).avgCycleLength).toBe(90);
    expect(rhythmToProfile(answers({ avgCycleLength: 120 })).avgCycleLength).toBe(90);
  });
});

describe('period durations 1–15 days', () => {
  it.each([1, 7, 10, 15])('saves a %i-day period and keeps it in the phase map', (n) => {
    const p = rhythmToProfile(answers({ avgPeriodLength: n }));
    expect(p.avgPeriodLength).toBe(n);
    expect(getPhases(28, n)[0].range).toEqual([1, n]);
    const pred = predict({ lastPeriodStart: TODAY, avgCycleLength: 28, avgPeriodLength: n, now: NOW });
    expect(pred.periodWindow.end).toBe(addDaysISO(TODAY, n - 1));
  });

  it('never crashes on extreme combinations (15-day cycle, 15-day period)', () => {
    for (let d = 1; d <= 15; d++) expect(typeof phaseForDay(d, 15, 15)).toBe('string');
    for (let d = 1; d <= 90; d++) expect(typeof phaseForDay(d, 90, 1)).toBe('string');
  });
});

describe('varies / not sure — no fabricated number', () => {
  it.each(['varies', 'unsure'] as const)('cycle "%s" is not stored or shown as her number', (pref) => {
    const p = rhythmToProfile(answers({ avgCycleLength: 35, cycleLengthPreference: pref }));
    expect(p.cycleLengthPreference).toBe(pref);
    expect(reportedCycleLength(p)).toBeNull();
    expect(p.avgCycleLength).not.toBe(35); // the abandoned stepper value is not kept
    expect(cycleLengthLabel(p)).toBe(pref === 'varies' ? 'Varies' : 'Not sure yet');
  });

  it.each(['varies', 'unsure'] as const)('period "%s" shows no number', (pref) => {
    const p = rhythmToProfile(answers({ avgPeriodLength: 9, periodDurationPreference: pref }));
    expect(periodLengthLabel(p)).not.toMatch(/\d/);
  });

  it('existing users (no preference saved) keep their number', () => {
    const old = { avgCycleLength: 30, avgPeriodLength: 6 } as Profile;
    expect(cycleLengthLabel(old)).toBe('30 days');
    expect(periodLengthLabel(old)).toBe('6 days');
  });
});

describe('confidence: general guidance when data is sparse, unknown or variable', () => {
  const regular: Partial<Profile> = {};

  it('unsure / varies with little history → no confident phase claims', () => {
    expect(phaseReliability({ cycleLengthPreference: 'unsure' }, logs(TODAY))).toBe('partial');
    expect(phaseReliability({ cycleLengthPreference: 'varies' }, logs(TODAY))).toBe('partial');
    expect(phaseReliability({ cycleLengthPreference: 'known' }, logs(TODAY))).toBe('reliable');
    expect(phaseReliability(regular, [])).toBe('reliable'); // existing users unchanged
  });

  it('her own consistent history outweighs "not sure"', () => {
    const h = logs('2026-08-01', '2026-08-29', '2026-09-26', '2026-10-24');
    expect(phaseReliability({ cycleLengthPreference: 'unsure' }, h)).toBe('reliable');
  });

  it('notifications fall back to general guidance for low confidence', () => {
    const plan = buildPlan({
      now: NOW,
      userKey: 'u',
      library: BUNDLED_LIBRARY,
      prefs: { enabled: true, dailyHour: 9, dailyMinute: 0, eveningCheckin: false, eveningHour: 20, eveningMinute: 0, periodConfirm: false },
      cycle: {
        mode: 'regular',
        reliability: phaseReliability({ cycleLengthPreference: 'unsure' }, logs(addDaysISO(TODAY, -7))),
        lastPeriodStart: addDaysISO(TODAY, -7),
        avgCycleLength: 28,
        avgPeriodLength: 5,
        history: logs(addDaysISO(TODAY, -7)),
      },
      dailyLogs: { [TODAY]: { dateISO: TODAY, energy: 3, mood: 'ok', win: '' } },
      sent: [],
    });
    plan.items.forEach((i) => {
      expect(i.phase).toBeNull();
      expect(i.trigger).not.toBe('phase');
    });
  });
});

describe('cycles recorded as 21, 28 and 24 days', () => {
  const h = logs('2026-07-01', '2026-07-22', '2026-08-19', '2026-09-12');

  it('preserves each actual cycle', () => {
    expect(cycleStats(h).lengths).toEqual([21, 28, 24]);
  });

  it('uses a robust median, keeps the range, and does not use the average', () => {
    const s = cycleStats(h);
    expect(s.typical).toBe(24); // median of 21, 24, 28 (mean would be 24.33…)
    expect([s.min, s.max, s.spread]).toEqual([21, 28, 7]);
    const pred = predict({ lastPeriodStart: '2026-09-12', avgCycleLength: 30, avgPeriodLength: 5, history: h, now: new Date(2026, 8, 20) });
    expect(pred.cycleRange).toEqual({ min: 21, max: 28, typical: 24, count: 3 });
  });

  it('treats a week of variation as variable → softened suggestions', () => {
    expect(phaseReliability({}, h)).toBe('partial');
  });

  it('a single unusual month does not swing the estimate (median, not mean)', () => {
    const odd = logs('2026-05-01', '2026-05-29', '2026-06-26', '2026-08-21', '2026-09-18');
    expect(cycleStats(odd).lengths).toEqual([28, 28, 56, 28]);
    expect(effectiveCycleLength(28, odd)).toBe(28);
  });

  it('ignores impossible gaps (a duplicate or missed log)', () => {
    expect(cycleStats(logs('2026-09-01', '2026-09-05', '2026-10-01')).lengths).toEqual([26]);
  });
});

describe('logging a new period', () => {
  beforeEach(() => {
    useAppStore.setState({ profile: { id: 'u', name: 'T', gender: 'female', birthDate: '', avgCycleLength: 28, avgPeriodLength: 5 }, cycleLogs: [] });
  });

  it('adds one entry, never a duplicate, and never rewrites past dates', () => {
    const add = useAppStore.getState().addCycleLog;
    add({ id: 'a', userId: 'u', startDate: '2026-09-01' });
    add({ id: 'b', userId: 'u', startDate: '2026-10-01' });
    add({ id: 'c', userId: 'u', startDate: '2026-10-01' }); // logged twice
    const starts = useAppStore.getState().cycleLogs.map((l) => l.startDate);
    expect(starts).toEqual(['2026-10-01', '2026-09-01']);
  });

  it('only moves future estimates', () => {
    const before = predict({ lastPeriodStart: '2026-10-01', avgCycleLength: 28, avgPeriodLength: 5, now: NOW });
    const after = predict({ lastPeriodStart: '2026-11-10', avgCycleLength: 28, avgPeriodLength: 5, history: logs('2026-10-01', '2026-11-10'), now: NOW });
    expect(after.nextPeriodStart > before.nextPeriodStart).toBe(true);
  });
});

describe('missing / partial data never crashes', () => {
  it('handles a missing cycle or period length', () => {
    const p = predict({ lastPeriodStart: TODAY, avgCycleLength: undefined as unknown as number, avgPeriodLength: null as unknown as number, now: NOW });
    expect(p.cycleLength).toBe(28);
    expect(p.periodWindow.end).toBe(addDaysISO(TODAY, 4));
    expect(cycleLengthLabel({ avgCycleLength: 28 })).toBe('28 days');
  });
});

describe('backward compatibility', () => {
  it('recognises a missing database column so profile saves can retry without it', () => {
    expect(isMissingColumn({ code: 'PGRST204', message: "Could not find the 'cycle_length_preference' column" })).toBe(true);
    expect(isMissingColumn({ code: '42703' })).toBe(true);
    expect(isMissingColumn({ code: '23505', message: 'duplicate key' })).toBe(false);
  });

  it('remote switches accept only known boolean flags', () => {
    expect(parseFlags({ rhythmOnboarding: false, junk: true, ratingPrompt: 'no' })).toEqual({ rhythmOnboarding: false });
    expect(parseFlags(null)).toEqual({});
  });
});

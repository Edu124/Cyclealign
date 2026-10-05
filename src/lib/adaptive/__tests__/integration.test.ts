import type { DailyLog, Prediction } from '@/types/models';
import { addDaysISO } from '@/lib/dates';
import { predictionEngine } from '@/lib/prediction/engine';
import { createScorer } from '../scoring';
import { buildDayPlan } from '../dayPlan';
import { rankWindows } from '../windows';
import type { DayContext, SlotEvent } from '../windows';
import {
  ADAPTIVE_PARTNER_MESSAGES,
  PARTNER_MESSAGES,
  adaptiveTone,
  pickAdaptiveMessage,
  resolveModeFromAnswers,
} from '../../../../supabase/functions/_shared/partnerDigest';

const TODAY = '2026-10-05'; // Monday

const log = (dateISO: string, p: Partial<DailyLog> = {}): DailyLog => ({ dateISO, energy: 3, mood: 'ok', win: '', ...p });
const good: Partial<DailyLog> = { energy: 4, mood: 'good', focus: 4, decisionConfidence: 4, sleepQuality: 4 };
const poor: Partial<DailyLog> = { energy: 2, mood: 'low', focus: 2, decisionConfidence: 2, sleepQuality: 2 };

function tenWeeks(): DailyLog[] {
  const out: DailyLog[] = [];
  for (let i = 1; i <= 70; i++) {
    const d = addDaysISO(TODAY, -i);
    const dow = new Date(`${d}T12:00:00`).getDay();
    out.push(
      log(d, dow === 3 ? good : dow === 2 ? poor : { energy: 3, mood: 'ok', focus: 3, decisionConfidence: 3, sleepQuality: 3 }),
    );
  }
  return out;
}

const ctxFor = (mode: DayContext['mode'], history: DailyLog[], todayLog?: DailyLog): DayContext => ({
  mode,
  history,
  todayISO: TODAY,
  todayLog,
});

describe('regular users keep exactly today’s experience', () => {
  const prediction: Prediction = predictionEngine.predict({
    lastPeriodStart: '2026-10-04',
    avgCycleLength: 28,
    avgPeriodLength: 5,
    now: new Date(`${TODAY}T12:00:00`),
  });

  test('scoring is the unchanged phase × task matrix', () => {
    const scorer = createScorer({ mode: 'regular', prediction, ctx: ctxFor('regular', []) });
    // Day 2 of the cycle (menstrual): a high-stakes conversation is a red day, admin is green.
    expect(scorer.scoreFor('HIGH_CONVO', TODAY).score).toBe('red');
    expect(scorer.scoreFor('ADMIN', TODAY).score).toBe('green');
    expect(scorer.scoreFor('HIGH_CONVO', TODAY).phaseLabel).toBe('Menstrual');
    expect(scorer.scoreFor('HIGH_CONVO', TODAY).phaseRowLabel).toBe('Current phase');
    expect(scorer.betterDates('HIGH_CONVO', 3).length).toBe(3);
  });
});

describe('adaptive scoring never mentions a phase', () => {
  test('PCOS user with no history: unscored, not guessed', () => {
    const scorer = createScorer({ mode: 'pcos_irregular', prediction: null, ctx: ctxFor('pcos_irregular', []) });
    const r = scorer.scoreFor('HIGH_CONVO', TODAY);
    expect(r.score).toBeNull();
    expect(r.level).toBe('INSUFFICIENT_DATA');
    expect(r.phase).toBeNull();
    expect(r.phaseRowLabel).toBe('Your readiness');
  });

  test('PCOS user with a strong check-in: today is green, with a plain-language note', () => {
    const today = log(TODAY, { energy: 5, mood: 'great', focus: 5, decisionConfidence: 5, sleepQuality: 5 });
    const scorer = createScorer({ mode: 'pcos_irregular', prediction: null, ctx: ctxFor('pcos_irregular', tenWeeks(), today) });
    const r = scorer.scoreFor('HIGH_CONVO', TODAY);
    expect(r.score).toBe('green');
    expect(r.note).toMatch(/strong window/i);
    expect(r.note).not.toMatch(/phase|hormon|ovulat/i);
  });

  test('perimenopause with poor sleep and symptoms: today is flagged red', () => {
    const today = log(TODAY, { ...poor, symptoms: ['hot_flashes', 'night_sweats'] });
    const scorer = createScorer({ mode: 'perimenopause', prediction: null, ctx: ctxFor('perimenopause', tenWeeks(), today) });
    expect(scorer.scoreFor('DECISION', TODAY).score).toBe('red');
  });

  test('better dates come from her own pattern: the strong Wednesday', () => {
    const scorer = createScorer({ mode: 'pcos_irregular', prediction: null, ctx: ctxFor('pcos_irregular', tenWeeks()) });
    const dates = scorer.betterDates('HIGH_CONVO', 3);
    expect(dates).toContain('2026-10-07');
    dates.forEach((d) => {
      const dow = new Date(`${d}T12:00:00`).getDay();
      expect([0, 6]).not.toContain(dow);
    });
  });

  test('private events are never scored', () => {
    const scorer = createScorer({ mode: 'pcos_irregular', prediction: null, ctx: ctxFor('pcos_irregular', tenWeeks()) });
    expect(scorer.scoreFor('PERSONAL', '2026-10-07').score).toBeNull();
  });
});

describe('Optimize My Day', () => {
  const ctx = ctxFor(
    'pcos_irregular',
    tenWeeks(),
    log(TODAY, { energy: 2, mood: 'low', focus: 2, decisionConfidence: 2, sleepQuality: 2 }),
  );
  const events: SlotEvent[] = [
    { id: 'a', title: 'Investor meeting', categoryId: 'HIGH_CONVO', dateISO: TODAY, startMin: 10 * 60, endMin: 11 * 60 },
    { id: 'b', title: 'Admin', categoryId: 'ADMIN', dateISO: TODAY, startMin: 14 * 60, endMin: 15 * 60 },
    { id: 'c', title: 'Private', categoryId: 'PERSONAL', dateISO: TODAY, startMin: 16 * 60, endMin: 17 * 60 },
  ];
  const rank = (cat: string, title: string | undefined, opts: { excludeDateISO: string; days: number }) =>
    rankWindows({ categoryId: cat, title, fromISO: addDaysISO(TODAY, 1), days: opts.days, events: [], ctx, excludeDateISO: opts.excludeDateISO });

  test('a low-capacity day offers a stronger window for the high-stakes meeting, never moves it itself', () => {
    const plan = buildDayPlan(events, ctx, rank, () => false);
    const investor = plan.find((p) => p.event.id === 'a')!;
    expect(investor.advice).toBe('move');
    expect(investor.window?.dateISO).toBe('2026-10-07');
  });

  test('admin stays flexible and private events are left alone', () => {
    const plan = buildDayPlan(events, ctx, rank, () => false);
    expect(plan.find((p) => p.event.id === 'b')!.advice).toBe('flex');
    expect(plan.find((p) => p.event.id === 'c')!.advice).toBe('private');
  });

  test('a rejected suggestion is not offered again', () => {
    const plan = buildDayPlan(events, ctx, rank, (_e, w) => w.dateISO === '2026-10-07');
    const investor = plan.find((p) => p.event.id === 'a')!;
    expect(investor.window?.dateISO).not.toBe('2026-10-07');
  });

  test('plan is ordered by start time', () => {
    const plan = buildDayPlan(events, ctx, rank, () => false);
    const starts = plan.map((p) => p.event.startMin ?? 9999);
    expect([...starts].sort((x, y) => x - y)).toEqual(starts);
  });
});

describe('partner messages for adaptive users', () => {
  test('routing matches the app for every combination', () => {
    expect(resolveModeFromAnswers(undefined, undefined)).toBe('regular');
    expect(resolveModeFromAnswers('REGULAR', 'REGULAR')).toBe('regular');
    expect(resolveModeFromAnswers('VARIABLE', null)).toBe('regular');
    expect(resolveModeFromAnswers('IRREGULAR', null)).toBe('pcos_irregular');
    expect(resolveModeFromAnswers(null, 'PCOS')).toBe('pcos_irregular');
    expect(resolveModeFromAnswers(null, 'POSTPARTUM')).toBe('pcos_irregular');
    expect(resolveModeFromAnswers('CHANGING', null)).toBe('perimenopause');
    expect(resolveModeFromAnswers('REGULAR', 'PERIMENOPAUSE')).toBe('perimenopause');
  });

  test('no adaptive message mentions a phase, ovulation, a period or hormones', () => {
    const all = [...ADAPTIVE_PARTNER_MESSAGES.good, ...ADAPTIVE_PARTNER_MESSAGES.tough, ...ADAPTIVE_PARTNER_MESSAGES.unknown];
    all.forEach((m) => expect(m).not.toMatch(/phase|ovulat|period|luteal|follicular|hormon|cycle/i));
  });

  test('tone follows what she reports today, and says nothing when there is nothing to go on', () => {
    expect(adaptiveTone(null)).toBe('unknown');
    expect(adaptiveTone({ energy: 1, mood: 'ok' })).toBe('tough');
    expect(adaptiveTone({ energy: 5, mood: 'great' })).toBe('good');
    expect(adaptiveTone({ energy: 3, mood: 'ok' })).toBe('unknown');
    expect(adaptiveTone({ energy: 3, mood: 'ok', sleepQuality: 1 })).toBe('tough');
  });

  test('rotates: no message shows for more than two days in a row', () => {
    const msgs = Array.from({ length: 12 }, (_, i) => pickAdaptiveMessage('tough', addDaysISO('2026-10-01', i)));
    let run = 1;
    for (let i = 1; i < msgs.length; i++) {
      run = msgs[i] === msgs[i - 1] ? run + 1 : 1;
      expect(run).toBeLessThanOrEqual(2);
    }
    expect(new Set(msgs).size).toBeGreaterThanOrEqual(4);
  });

  test('regular partner messages are untouched', () => {
    expect(PARTNER_MESSAGES.luteal_late.tough.length).toBe(4);
  });
});

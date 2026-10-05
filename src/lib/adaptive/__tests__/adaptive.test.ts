import type { DailyLog } from '@/types/models';
import { addDaysISO } from '@/lib/dates';
import { phaseReliability, resolveMode } from '../mode';
import { evaluateReadiness, predictReadiness } from '../readiness';
import { derivePatterns } from '../patterns';
import { needsClinicianPrompt, buildClinicianReport } from '../safety';
import { freeBlocks, rankWindows, readinessTypeFor } from '../windows';
import type { DayContext } from '../windows';

const TODAY = '2026-10-05'; // a Monday

function log(dateISO: string, p: Partial<DailyLog> = {}): DailyLog {
  return { dateISO, energy: 3, mood: 'ok', win: '', ...p };
}

const good: Partial<DailyLog> = {
  energy: 4, mood: 'good', focus: 4, decisionConfidence: 4, sleepQuality: 4,
};
const poor: Partial<DailyLog> = {
  energy: 2, mood: 'low', focus: 2, decisionConfidence: 2, sleepQuality: 2,
};

/** 10 weeks of history: Wednesdays strong, Tuesdays poor, everything else middling. */
function tenWeeks(): DailyLog[] {
  const out: DailyLog[] = [];
  for (let i = 1; i <= 70; i++) {
    const d = addDaysISO(TODAY, -i);
    const dow = new Date(`${d}T12:00:00`).getDay();
    if (dow === 3) out.push(log(d, good));
    else if (dow === 2) out.push(log(d, poor));
    else out.push(log(d, { energy: 3, mood: 'ok', focus: 3, decisionConfidence: 3, sleepQuality: 3 }));
  }
  return out;
}

describe('mode routing', () => {
  test('existing user with no new answers stays on the regular experience', () => {
    expect(resolveMode({})).toBe('regular');
    expect(resolveMode(null)).toBe('regular');
    expect(phaseReliability({}, [])).toBe('reliable');
  });

  test('routes PCOS / irregular / perimenopause / unsure away from the 28-day model', () => {
    expect(resolveMode({ healthContext: 'PCOS' })).toBe('pcos_irregular');
    expect(resolveMode({ cycleRegularity: 'IRREGULAR' })).toBe('pcos_irregular');
    expect(resolveMode({ cycleRegularity: 'UNKNOWN' })).toBe('pcos_irregular');
    expect(resolveMode({ healthContext: 'PERIMENOPAUSE' })).toBe('perimenopause');
    expect(resolveMode({ cycleRegularity: 'CHANGING' })).toBe('perimenopause');
  });

  test('a variable-but-regular user keeps phases, as a lighter input', () => {
    expect(resolveMode({ cycleRegularity: 'VARIABLE' })).toBe('regular');
    expect(phaseReliability({ cycleRegularity: 'VARIABLE' }, [])).toBe('partial');
  });

  test('irregular PCOS cycles (34/48/39/57) never produce a trusted phase', () => {
    const starts = ['2026-01-01', '2026-02-04', '2026-03-24', '2026-05-02', '2026-06-28'];
    expect(phaseReliability({ healthContext: 'PCOS' }, starts.map((s) => ({ startDate: s })))).toBe('none');
    // Even someone who called themselves regular, but whose real cycles swing, is downgraded.
    expect(phaseReliability({}, starts.map((s) => ({ startDate: s })))).toBe('partial');
  });

  test('perimenopause cycles (29/42/24/51) are not forced into 28 days', () => {
    expect(resolveMode({ healthContext: 'PERIMENOPAUSE' })).toBe('perimenopause');
    expect(phaseReliability({ healthContext: 'PERIMENOPAUSE' }, [])).toBe('none');
  });
});

describe('current-state readiness', () => {
  test('PCOS: strong sleep + energy + focus gives a strong window without any phase', () => {
    const r = evaluateReadiness({
      log: log(TODAY, { energy: 5, mood: 'great', focus: 5, decisionConfidence: 5, sleepQuality: 5 }),
      type: 'DECISION',
      mode: 'pcos_irregular',
    });
    expect(r.level).toBe('STRONG');
    expect(r.sources).not.toContain('cycle_phase');
  });

  test('PCOS: a cycle-phase prior is ignored entirely', () => {
    const base = { log: log(TODAY, good), type: 'DECISION' as const, mode: 'pcos_irregular' as const };
    const withPrior = evaluateReadiness({ ...base, phasePrior: 'HIGH', phaseReliability: 'reliable' });
    const without = evaluateReadiness(base);
    expect(withPrior.score).toBe(without.score);
  });

  test('perimenopause: poor sleep + symptoms is reflected, not smoothed over', () => {
    const r = evaluateReadiness({
      log: log(TODAY, { ...poor, symptoms: ['hot_flashes', 'night_sweats', 'brain_fog'] }),
      type: 'DECISION',
      mode: 'perimenopause',
    });
    expect(r.level).toBe('PROTECT');
    expect(r.reasons.join(' ')).toMatch(/Sleep was poor|energy is low/i);
  });

  test('no data: INSUFFICIENT_DATA, never a fabricated level', () => {
    expect(evaluateReadiness({ log: null, type: 'DECISION', mode: 'pcos_irregular' }).level).toBe('INSUFFICIENT_DATA');
    expect(evaluateReadiness({ log: null, type: 'DECISION', mode: 'perimenopause' }).level).toBe('INSUFFICIENT_DATA');
    expect(evaluateReadiness({ log: null, type: 'DECISION', mode: 'regular' }).level).toBe('INSUFFICIENT_DATA');
  });

  test('adaptive modes need more than energy + mood', () => {
    const r = evaluateReadiness({ log: log(TODAY, { energy: 5, mood: 'great' }), type: 'DECISION', mode: 'pcos_irregular' });
    expect(r.level).toBe('INSUFFICIENT_DATA');
  });

  test('regular + reliable cycle still gets a (cautious) read without a log', () => {
    const r = evaluateReadiness({ log: null, type: 'DECISION', mode: 'regular', phasePrior: 'HIGH', phaseReliability: 'reliable' });
    expect(r.level).not.toBe('INSUFFICIENT_DATA');
    expect(r.level).not.toBe('STRONG');
    expect(r.confidence).toBe('low');
  });

  test('a low-confidence read can never claim STRONG', () => {
    const r = evaluateReadiness({
      log: log(TODAY, { energy: 5, mood: 'great', focus: 5 }),
      type: 'FOCUS',
      mode: 'pcos_irregular',
    });
    expect(r.confidence).toBe('low');
    expect(r.level).not.toBe('STRONG');
  });
});

describe('looking ahead', () => {
  test('too little history: INSUFFICIENT_DATA', () => {
    const few = [1, 2, 3].map((i) => log(addDaysISO(TODAY, -i), good));
    expect(predictReadiness({ dateISO: '2026-10-07', type: 'DECISION', history: few, todayISO: TODAY }).level).toBe('INSUFFICIENT_DATA');
  });

  test('learns that her Wednesdays run stronger than her Tuesdays', () => {
    const h = tenWeeks();
    const tue = predictReadiness({ dateISO: '2026-10-06', type: 'DECISION', history: h, todayISO: TODAY });
    const wed = predictReadiness({ dateISO: '2026-10-07', type: 'DECISION', history: h, todayISO: TODAY });
    expect(wed.score as number).toBeGreaterThan(tue.score as number);
    expect(wed.reasons.join(' ')).toMatch(/Wednesdays tend to run higher/);
  });
});

describe('decision windows', () => {
  const ctx = (history: DailyLog[]): DayContext => ({
    mode: 'pcos_irregular',
    history,
    todayISO: TODAY,
    todayLog: undefined,
  });

  test('investor meeting: the strongest available window is the strong Wednesday', () => {
    const w = rankWindows({
      categoryId: 'HIGH_CONVO',
      title: 'Investor meeting',
      fromISO: addDaysISO(TODAY, 1),
      days: 5,
      events: [],
      ctx: ctx(tenWeeks()),
    });
    expect(w.length).toBeGreaterThan(0);
    expect(w[0].dateISO).toBe('2026-10-07'); // Wednesday
    expect(w[0].reasons.length).toBeGreaterThan(0);
    expect(w[0].reasons.length).toBeLessThanOrEqual(3);
    expect(new Date(`${w[0].dateISO}T12:00:00`).getDay()).toBe(3);
  });

  test('not enough history: offers no window rather than inventing one', () => {
    const w = rankWindows({
      categoryId: 'HIGH_CONVO',
      fromISO: addDaysISO(TODAY, 1),
      days: 5,
      events: [],
      ctx: ctx([]),
    });
    expect(w).toEqual([]);
  });

  test('never proposes a slot that overlaps an existing event', () => {
    const events = [
      { id: 'a', categoryId: 'MEETING', dateISO: '2026-10-07', startMin: 9 * 60, endMin: 12 * 60 },
    ];
    const w = rankWindows({
      categoryId: 'HIGH_CONVO',
      fromISO: '2026-10-07',
      days: 1,
      events,
      ctx: ctx(tenWeeks()),
    });
    expect(w[0].startMin).toBeGreaterThanOrEqual(12 * 60);
  });

  test('weekends are skipped unless she already has something on them', () => {
    const w = rankWindows({
      categoryId: 'MEETING',
      fromISO: '2026-10-10', // Saturday
      days: 2,
      events: [],
      ctx: ctx(tenWeeks()),
    });
    expect(w).toEqual([]);
  });

  test('private events never get a recommendation', () => {
    expect(readinessTypeFor('PERSONAL')).toBeNull();
    const w = rankWindows({ categoryId: 'PERSONAL', fromISO: TODAY, events: [], ctx: ctx(tenWeeks()) });
    expect(w).toEqual([]);
  });

  test('free blocks respect busy intervals', () => {
    const blocks = freeBlocks(
      [
        { id: '1', categoryId: 'MEETING', dateISO: TODAY, startMin: 10 * 60, endMin: 11 * 60 },
        { id: '2', categoryId: 'MEETING', dateISO: TODAY, startMin: 14 * 60, endMin: 15 * 60 },
      ],
      TODAY,
    );
    expect(blocks).toEqual([[540, 600], [660, 840], [900, 1080]]);
  });
});

describe('personal patterns', () => {
  test('stays quiet until there is enough data', () => {
    const s = derivePatterns([log(addDaysISO(TODAY, -1), good)], TODAY);
    expect(s.stage).toBe('none');
    expect(s.insights).toEqual([]);
  });

  test('observations use "tend to report" language and make no causal or hormonal claims', () => {
    const s = derivePatterns(tenWeeks(), TODAY);
    expect(s.stage).not.toBe('none');
    expect(s.insights.length).toBeGreaterThan(0);
    for (const i of s.insights) {
      expect(i.text).toMatch(/tend to report|Your logged data shows|often follow/);
      expect(i.text).not.toMatch(/hormon|because|cause|diagnos/i);
    }
  });
});

describe('safety layer', () => {
  test('three or more flagged days in two weeks prompts a neutral clinician nudge', () => {
    const flagged = [1, 2, 3].map((i) => log(addDaysISO(TODAY, -i), { symptoms: ['heavy_bleeding'] }));
    expect(needsClinicianPrompt(flagged, TODAY)).toBe(true);
    expect(needsClinicianPrompt(flagged.slice(0, 2), TODAY)).toBe(false);
  });

  test('the report only summarises what she entered and carries the disclaimer', () => {
    const r = buildClinicianReport(tenWeeks(), TODAY);
    expect(r).toContain('It is not a medical diagnosis.');
    expect(r).not.toMatch(/diagnos(is|ed) of|you have/i);
  });
});

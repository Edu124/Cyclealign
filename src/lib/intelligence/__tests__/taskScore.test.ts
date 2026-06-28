import { LocalStatisticalEngine } from '@/lib/prediction/engine';
import { phaseForDate, scoreForDate, greenDates } from '../taskScore';

const engine = new LocalStatisticalEngine();
const now = (iso: string) => new Date(`${iso}T12:00:00`);

// 28-day cycle anchored at 2026-06-01.
const prediction = engine.predict({
  lastPeriodStart: '2026-06-01',
  avgCycleLength: 28,
  avgPeriodLength: 5,
  now: now('2026-06-12'),
});

describe('phaseForDate (5-phase, capacity)', () => {
  it('splits luteal into early and late', () => {
    // day 2 menstrual, 9 follicular, 15 ovulatory, then luteal early/late
    expect(phaseForDate('2026-06-02', prediction)).toBe('menstrual');
    expect(phaseForDate('2026-06-09', prediction)).toBe('follicular');
    expect(phaseForDate('2026-06-15', prediction)).toBe('ovulatory');
    const early = phaseForDate('2026-06-19', prediction);
    const late = phaseForDate('2026-06-27', prediction);
    expect(early).toBe('luteal_early');
    expect(late).toBe('luteal_late');
  });
});

describe('scoreForDate (SCORE_MATRIX)', () => {
  it('scores HIGH_CONVO green at ovulation, red at menstrual/late-luteal', () => {
    expect(scoreForDate('HIGH_CONVO', '2026-06-15', prediction).score).toBe('green');
    expect(scoreForDate('HIGH_CONVO', '2026-06-02', prediction).score).toBe('red');
    expect(scoreForDate('HIGH_CONVO', '2026-06-27', prediction).score).toBe('red');
  });

  it('scores ADMIN green in every phase', () => {
    for (const d of ['2026-06-02', '2026-06-09', '2026-06-15', '2026-06-19', '2026-06-27']) {
      expect(scoreForDate('ADMIN', d, prediction).score).toBe('green');
    }
  });

  it('returns null score for PERSONAL (no badge)', () => {
    expect(scoreForDate('PERSONAL', '2026-06-15', prediction).score).toBeNull();
  });

  it('DEEP_FOCUS is green in follicular + luteal-early, amber at ovulation', () => {
    expect(scoreForDate('DEEP_FOCUS', '2026-06-09', prediction).score).toBe('green');
    expect(scoreForDate('DEEP_FOCUS', '2026-06-19', prediction).score).toBe('green');
    expect(scoreForDate('DEEP_FOCUS', '2026-06-15', prediction).score).toBe('amber');
  });
});

describe('greenDates', () => {
  it('only returns dates that score green for the category', () => {
    const dates = greenDates('HIGH_CONVO', prediction, 30, now('2026-06-12'));
    expect(dates.length).toBeGreaterThan(0);
    for (const d of dates) {
      expect(scoreForDate('HIGH_CONVO', d, prediction).score).toBe('green');
    }
  });
});

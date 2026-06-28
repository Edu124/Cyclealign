import { LocalStatisticalEngine } from '@/lib/prediction/engine';
import {
  phaseForDate,
  weekOutlook,
  recommendedWindows,
  cyclePhaseWindows,
} from '../schedule';

const engine = new LocalStatisticalEngine();
const now = (iso: string) => new Date(`${iso}T12:00:00`);

// 28-day cycle anchored at 2026-06-01.
const prediction = engine.predict({
  lastPeriodStart: '2026-06-01',
  avgCycleLength: 28,
  avgPeriodLength: 5,
  now: now('2026-06-12'),
});

describe('phaseForDate', () => {
  it('matches the phase across a known 28-day cycle', () => {
    const anchor = '2026-06-01';
    expect(phaseForDate('2026-06-02', anchor, 28, 5)).toBe('menstrual'); // day 2
    expect(phaseForDate('2026-06-09', anchor, 28, 5)).toBe('follicular'); // day 9
    expect(phaseForDate('2026-06-15', anchor, 28, 5)).toBe('ovulation'); // day 15
    expect(phaseForDate('2026-06-25', anchor, 28, 5)).toBe('luteal'); // day 25
  });

  it('projects correctly into a future cycle (modular)', () => {
    const anchor = '2026-06-01';
    // 2026-06-29 is day 1 of the next cycle -> menstrual again.
    expect(phaseForDate('2026-06-29', anchor, 28, 5)).toBe('menstrual');
    // 28 days after ovulation day 15 -> 2026-07-13 ovulation again.
    expect(phaseForDate('2026-07-13', anchor, 28, 5)).toBe('ovulation');
  });
});

describe('weekOutlook', () => {
  it('returns the requested number of consecutive days starting today', () => {
    const week = weekOutlook(prediction, now('2026-06-12'), 7);
    expect(week).toHaveLength(7);
    expect(week[0].dateISO).toBe('2026-06-12');
    expect(week[0].isToday).toBe(true);
    expect(week[6].dateISO).toBe('2026-06-18');
  });

  it('labels each day with the correct phase + theme', () => {
    const week = weekOutlook(prediction, now('2026-06-12'), 7);
    const ovDay = week.find((d) => d.dateISO === '2026-06-15');
    expect(ovDay?.phase).toBe('ovulation');
    expect(ovDay?.theme).toBe('Connect');
  });
});

describe('recommendedWindows', () => {
  it('produces one upcoming window per activity, ending on/after today', () => {
    const recs = recommendedWindows(prediction, now('2026-06-12'));
    expect(recs).toHaveLength(4);
    for (const r of recs) {
      // window end must not be in the past
      expect(new Date(r.end) >= new Date('2026-06-12')).toBe(true);
    }
  });

  it('maps the pitch window to the ovulation phase dates', () => {
    const recs = recommendedWindows(prediction, now('2026-06-12'));
    const pitch = recs.find((r) => r.activity === 'Pitch & present');
    expect(pitch?.phase).toBe('ovulation');
    const ovWindow = cyclePhaseWindows(prediction).find(
      (w) => w.phase === 'ovulation',
    )!;
    expect(pitch?.start).toBe(ovWindow.start);
  });

  it('rolls a passed window forward to the next cycle', () => {
    // On day 27 (2026-06-27), the menstrual "Reflect" window (days 1-5) is past
    // -> should roll to the next cycle starting 2026-06-29.
    const recs = recommendedWindows(prediction, now('2026-06-27'));
    const reflect = recs.find((r) => r.activity === 'Reflect & plan');
    expect(reflect?.start).toBe('2026-06-29');
  });
});

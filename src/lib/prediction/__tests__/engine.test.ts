import { LocalStatisticalEngine, effectiveCycleLength } from '../engine';
import { CycleLog } from '@/types/models';

const engine = new LocalStatisticalEngine();

// Use a fixed "now" so tests are deterministic regardless of when they run.
const now = (iso: string) => new Date(`${iso}T12:00:00`);

describe('LocalStatisticalEngine', () => {
  it('computes day of cycle from the last period start', () => {
    const p = engine.predict({
      lastPeriodStart: '2026-06-01',
      avgCycleLength: 28,
      avgPeriodLength: 5,
      now: now('2026-06-05'),
    });
    // June 1 is day 1, so June 5 is day 5.
    expect(p.dayOfCycle).toBe(5);
    expect(p.cycleLength).toBe(28);
  });

  it('predicts the next period one cycle after the start', () => {
    const p = engine.predict({
      lastPeriodStart: '2026-06-01',
      avgCycleLength: 28,
      avgPeriodLength: 5,
      now: now('2026-06-10'),
    });
    expect(p.nextPeriodStart).toBe('2026-06-29');
    expect(p.daysUntilNextPeriod).toBe(19); // June 10 -> June 29
  });

  it('places ovulation ~14 days before the next period with a fertile window', () => {
    const p = engine.predict({
      lastPeriodStart: '2026-06-01',
      avgCycleLength: 28,
      avgPeriodLength: 5,
      now: now('2026-06-10'),
    });
    // Next period June 29 -> ovulation June 15.
    expect(p.ovulationDate).toBe('2026-06-15');
    expect(p.fertileWindow.start).toBe('2026-06-10'); // 5 days before
    expect(p.fertileWindow.end).toBe('2026-06-16'); // 1 day after
  });

  it('reports the correct phase across the cycle', () => {
    const base = {
      lastPeriodStart: '2026-06-01',
      avgCycleLength: 28,
      avgPeriodLength: 5,
    };
    expect(engine.predict({ ...base, now: now('2026-06-02') }).currentPhase).toBe(
      'menstrual',
    );
    expect(engine.predict({ ...base, now: now('2026-06-09') }).currentPhase).toBe(
      'follicular',
    );
    expect(engine.predict({ ...base, now: now('2026-06-15') }).currentPhase).toBe(
      'ovulation',
    );
    expect(engine.predict({ ...base, now: now('2026-06-25') }).currentPhase).toBe(
      'luteal',
    );
  });

  it('rolls forward whole cycles when the last period is far in the past', () => {
    const p = engine.predict({
      lastPeriodStart: '2026-01-01',
      avgCycleLength: 30,
      avgPeriodLength: 5,
      now: now('2026-06-10'),
    });
    // Cycle start should be advanced to the cycle containing June 10.
    expect(p.dayOfCycle).toBeGreaterThanOrEqual(1);
    expect(p.dayOfCycle).toBeLessThanOrEqual(30);
    expect(p.daysUntilNextPeriod).toBeGreaterThanOrEqual(0);
  });

  it('refines the cycle length from historical gaps when 2+ logs exist', () => {
    // Three starts 30 days apart -> effective length should be 30, not the
    // self-reported 28.
    const history: CycleLog[] = [
      { id: '1', userId: 'u', startDate: '2026-04-02' },
      { id: '2', userId: 'u', startDate: '2026-05-02' },
      { id: '3', userId: 'u', startDate: '2026-06-01' },
    ];
    expect(effectiveCycleLength(28, history)).toBe(30);

    const p = engine.predict({
      lastPeriodStart: '2026-06-01',
      avgCycleLength: 28,
      avgPeriodLength: 5,
      history,
      now: now('2026-06-05'),
    });
    expect(p.cycleLength).toBe(30);
    expect(p.nextPeriodStart).toBe('2026-07-01');
  });

  it('clamps implausible cycle lengths into a safe range', () => {
    expect(effectiveCycleLength(2)).toBe(21);
    expect(effectiveCycleLength(120)).toBe(45);
  });
});

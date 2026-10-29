import { periodLengthFromLogs } from '../periodLength';
import type { CycleLog } from '@/types/models';

const log = (startDate: string, endDate: string | null): CycleLog => ({ id: startDate, userId: 'u', startDate, endDate });

describe('periodLengthFromLogs', () => {
  it('uses the period she marked — a 10-day period is 10, not capped at 8', () => {
    expect(periodLengthFromLogs([log('2026-10-01', '2026-10-10')], 8)).toBe(10);
  });

  it('averages her latest three marked periods', () => {
    const logs = [log('2026-10-01', '2026-10-10'), log('2026-09-03', '2026-09-08'), log('2026-08-06', '2026-08-12'), log('2026-07-01', '2026-07-02')];
    // 10, 6, 7 → 8 (the oldest one is ignored)
    expect(periodLengthFromLogs(logs, 5)).toBe(8);
  });

  it('keeps the onboarding answer when no period has an end date', () => {
    expect(periodLengthFromLogs([log('2026-10-01', null)], 6)).toBe(6);
  });

  it('stays within what predictions support (2–10 days)', () => {
    expect(periodLengthFromLogs([log('2026-10-01', '2026-10-14')], 5)).toBe(10);
    expect(periodLengthFromLogs([log('2026-10-01', '2026-10-01')], 5)).toBe(2);
  });
});

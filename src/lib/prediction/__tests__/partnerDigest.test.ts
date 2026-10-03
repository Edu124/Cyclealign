import { predictionEngine } from '@/lib/prediction/engine';
import { capacityPhaseFor } from '@/lib/intelligence/capacity';
import { addDaysISO, todayISO } from '@/lib/dates';
import {
  PARTNER_MESSAGES,
  capacityPhaseForDate,
  isToughDay,
  partnerMessageBucket,
  pickPartnerMessage,
} from '../../../../supabase/functions/_shared/partnerDigest';

describe('server-side capacity phase matches the app engine', () => {
  const cases: [number, number][] = [
    [28, 5], [21, 3], [24, 4], [26, 7], [30, 5], [35, 6], [45, 10], [33, 2],
  ];

  test.each(cases)('cycle %i / period %i, over several cycles', (cycle, period) => {
    const lastPeriodStart = '2026-01-10';
    const mismatches: string[] = [];
    for (let i = 0; i < cycle * 4; i++) {
      const dateISO = addDaysISO(lastPeriodStart, i);
      const now = new Date(`${dateISO}T12:00:00`);
      const app = capacityPhaseFor(
        predictionEngine.predict({
          lastPeriodStart,
          avgCycleLength: cycle,
          avgPeriodLength: period,
          now,
        }),
      );
      const server = capacityPhaseForDate({
        lastPeriodStart,
        avgCycleLength: cycle,
        avgPeriodLength: period,
        periodStarts: [lastPeriodStart],
        todayISO: todayISO(now),
      });
      if (app !== server) mismatches.push(`${dateISO}: app=${app} server=${server}`);
    }
    expect(mismatches).toEqual([]);
  });

  test('uses real cycle history when 3+ period starts exist', () => {
    const starts = ['2026-01-01', '2026-01-31', '2026-03-02']; // 30-day gaps
    const lastPeriodStart = starts[2];
    const mismatches: string[] = [];
    for (let i = 0; i < 90; i++) {
      const dateISO = addDaysISO(lastPeriodStart, i);
      const now = new Date(`${dateISO}T12:00:00`);
      const app = capacityPhaseFor(
        predictionEngine.predict({
          lastPeriodStart,
          avgCycleLength: 28,
          avgPeriodLength: 5,
          history: starts.map((startDate) => ({ id: startDate, userId: 'u', startDate })),
          now,
        }),
      );
      const server = capacityPhaseForDate({
        lastPeriodStart,
        avgCycleLength: 28,
        avgPeriodLength: 5,
        periodStarts: starts,
        todayISO: dateISO,
      });
      if (app !== server) mismatches.push(`${dateISO}: app=${app} server=${server}`);
    }
    expect(mismatches).toEqual([]);
  });
});

describe('partner message rotation', () => {
  test('every phase has several variants for both moods', () => {
    for (const phase of Object.keys(PARTNER_MESSAGES) as (keyof typeof PARTNER_MESSAGES)[]) {
      expect(PARTNER_MESSAGES[phase].good.length).toBeGreaterThanOrEqual(3);
      expect(PARTNER_MESSAGES[phase].tough.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('message is stable within a 2-day window and changes across windows', () => {
    const days = Array.from({ length: 12 }, (_, i) => addDaysISO('2026-10-01', i));
    const buckets = days.map(partnerMessageBucket);
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i] - buckets[i - 1]).toBeLessThanOrEqual(1);
    }
    const msgs = days.map((d) => pickPartnerMessage('luteal_late', true, d));
    // each message is shown for at most 2 consecutive days
    let run = 1;
    for (let i = 1; i < msgs.length; i++) {
      run = msgs[i] === msgs[i - 1] ? run + 1 : 1;
      expect(run).toBeLessThanOrEqual(2);
    }
    expect(new Set(msgs).size).toBeGreaterThanOrEqual(4);
  });

  test('a different phase always gives a different message', () => {
    const d = '2026-10-03';
    const all = (Object.keys(PARTNER_MESSAGES) as (keyof typeof PARTNER_MESSAGES)[]).map((p) =>
      pickPartnerMessage(p, true, d),
    );
    expect(new Set(all).size).toBe(all.length);
  });

  test("today's log overrides the phase guess", () => {
    expect(isToughDay('follicular', { energy: 1, mood: 'ok' })).toBe(true);
    expect(isToughDay('menstrual', { energy: 5, mood: 'great' })).toBe(false);
    expect(isToughDay('menstrual', undefined)).toBe(true);
    expect(isToughDay('ovulatory', undefined)).toBe(false);
  });
});

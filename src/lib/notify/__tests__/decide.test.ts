import { addDaysISO } from '@/lib/dates';
import type { CycleLog, DailyLog } from '@/types/models';
import { BUNDLED_LIBRARY, parseLibrary, type NotificationLibrary } from '../library';
import { buildPlan, dayContext, eventIdFor, isQuietNow, revalidate, type PlanInput, type SentRecord } from '../decide';
import { OUTDATED_NOTICE, resolveTap, routeForLink, SAFE_HOME } from '../deepLinks';
import { pickPopupItem, TAP_SUPPRESS_MS } from '../popup';
import type { LedgerItem } from '@/lib/stores/useNotificationLedger';

// Wed 11 Nov 2026, 07:00 local — before the default 09:00 message.
const NOW = new Date(2026, 10, 11, 7, 0, 0);
const TODAY = '2026-11-11';
const lib = BUNDLED_LIBRARY;
const cfg = lib.config;

/** Period start that puts TODAY on cycle day `day` (28-day cycle, 5-day period). */
const startFor = (day: number) => addDaysISO(TODAY, -(day - 1));

function cycle(day: number | null, logs = 2): PlanInput['cycle'] {
  const last = day == null ? null : startFor(day);
  const history: CycleLog[] = last
    ? Array.from({ length: logs }, (_, i) => ({ id: String(i), userId: 'u', startDate: addDaysISO(last, -28 * i) }))
    : [];
  return { mode: 'regular', reliability: 'reliable', lastPeriodStart: last, avgCycleLength: 28, avgPeriodLength: 5, history };
}

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    now: NOW,
    userKey: 'user-1',
    library: lib,
    prefs: {
      enabled: true,
      dailyHour: 9,
      dailyMinute: 0,
      eveningCheckin: false,
      eveningHour: 20,
      eveningMinute: 0,
      periodConfirm: false,
    },
    cycle: cycle(8),
    dailyLogs: { [TODAY]: log(TODAY, 'ok') },
    sent: [],
    ...over,
  };
}

function log(dateISO: string, mood: string, symptoms: string[] = [], bleeding?: string): DailyLog {
  return { dateISO, energy: 3, mood, win: '', symptoms, bleeding };
}

const todays = (p: ReturnType<typeof buildPlan>) => p.items.filter((i) => i.localDate === TODAY);
const primaryToday = (p: ReturnType<typeof buildPlan>) => todays(p).find((i) => i.type === 'daily_guidance')!;

describe('AT-01 correct phase selection', () => {
  it('uses the current estimated phase and labels it as an estimate', () => {
    const plan = buildPlan(input({ cycle: cycle(8) })); // day 8 → follicular
    expect(plan.today.phase).toBe('follicular');
    expect(plan.today.confidence).toBe('ok');
    const item = primaryToday(plan);
    expect(item.phase).toBe('follicular');
    expect(item.contentId.startsWith('follicular_')).toBe(true);
    expect(item.body).toMatch(/estimate|may be/i);
  });

  it('picks luteal "period may be approaching" copy only near the expected date', () => {
    const early = primaryToday(buildPlan(input({ cycle: cycle(17) })));
    expect(early.contentId).not.toBe('luteal_prepare');
    const late = primaryToday(buildPlan(input({ cycle: cycle(25) })));
    expect(late.contentId).toBe('luteal_prepare');
  });

  it('never makes phase copy a universal claim', () => {
    for (const m of lib.messages) {
      expect(m.body).not.toMatch(/you're at your peak|energy dips|energy's rising|you will feel/i);
    }
  });
});

describe('AT-02 / AT-03 symptom and mood personalisation', () => {
  it('selects comfort copy when cramps were logged', () => {
    const plan = buildPlan(input({ cycle: cycle(2), dailyLogs: { [TODAY]: log(TODAY, 'ok', ['cramps']) } }));
    expect(primaryToday(plan).contentId).toBe('symptom_cramps');
  });

  it('never mentions cramps when none were logged', () => {
    const plan = buildPlan(input({ cycle: cycle(2) }));
    plan.items.forEach((i) => expect(i.body).not.toMatch(/cramps/i));
  });

  it('uses yesterday\'s log when today has none, but never for days further out', () => {
    const yesterday = addDaysISO(TODAY, -1);
    const plan = buildPlan(input({ dailyLogs: { [yesterday]: log(yesterday, 'ok', ['cravings']) } }));
    expect(primaryToday(plan).contentId).toBe('symptom_cravings');
    plan.items.filter((i) => i.localDate > addDaysISO(TODAY, 1)).forEach((i) => expect(i.trigger).not.toBe('cravings'));
  });

  it('offers supportive copy for a low mood without diagnosing', () => {
    const item = primaryToday(buildPlan(input({ dailyLogs: { [TODAY]: log(TODAY, 'low') } })));
    expect(item.contentId).toBe('mood_low');
    expect(item.body).not.toMatch(/depress|disorder|diagnos/i);
  });

  it('asks for a check-in when no mood has been logged for a few days', () => {
    expect(primaryToday(buildPlan(input({ dailyLogs: {} }))).contentId).toBe('mood_missing');
  });

  it('shows safety guidance for severe symptoms ahead of everything else', () => {
    const item = primaryToday(buildPlan(input({ dailyLogs: { [TODAY]: log(TODAY, 'low', ['cramps', 'severe_pain']) } })));
    expect(item.contentId).toBe('safety_urgent');
    expect(item.body).toMatch(/healthcare professional/);
  });
});

describe('AT-04 no data fallback and low-confidence rules', () => {
  it('never claims a phase or ovulation without a period date', () => {
    const plan = buildPlan(input({ cycle: cycle(null) }));
    expect(plan.today.phase).toBeNull();
    plan.items.forEach((i) => {
      expect(i.phase).toBeNull();
      expect(i.body).not.toMatch(/ovulat|follicular|luteal|period phase/i);
    });
    // A one-time setup prompt, then general content.
    expect(plan.items.filter((i) => i.contentId === 'setup_cycle')).toHaveLength(1);
  });

  it('avoids ovulation copy when only one cycle is recorded', () => {
    const plan = buildPlan(input({ cycle: cycle(14, 1) }));
    expect(plan.today.confidence).toBe('low');
    plan.items.forEach((i) => expect(i.body).not.toMatch(/ovulat/i));
  });

  it('uses ovulation-window wording only with enough history', () => {
    const item = primaryToday(buildPlan(input({ cycle: cycle(14, 3) })));
    expect(item.body).toMatch(/near ovulation|ovulatory window/);
  });

  it('uses neutral messages for irregular, perimenopause and variable cycles', () => {
    for (const c of [
      { ...cycle(8), mode: 'pcos_irregular' as const },
      { ...cycle(8), mode: 'perimenopause' as const },
      { ...cycle(8), reliability: 'partial' as const },
    ]) {
      const plan = buildPlan(input({ cycle: c }));
      expect(plan.today.confidence).toBe('neutral');
      plan.items.forEach((i) => {
        expect(i.phase).toBeNull();
        expect(i.trigger).not.toBe('phase');
        expect(i.contentId).not.toBe('setup_cycle');
      });
    }
  });

  it('asks for an update when the cycle data is stale', () => {
    const plan = buildPlan(input({ cycle: cycle(40) })); // 12 days past due
    expect(plan.today.confidence).toBe('stale');
    expect(primaryToday(plan).contentId).toBe('cycle_stale');
    expect(primaryToday(plan).link).toBe('cycle_setup');
  });
});

describe('AT-05 / AT-06 daily cap and duplicate prevention', () => {
  it('never plans more than the cap for any day, even with every reminder on', () => {
    // Today is the estimated start date → tomorrow is the day after (period confirmation).
    const plan = buildPlan(
      input({
        cycle: cycle(29),
        dailyLogs: {},
        prefs: { ...input().prefs, eveningCheckin: true, periodConfirm: true },
      }),
    );
    const perDay: Record<string, number> = {};
    plan.items.forEach((i) => (perDay[i.localDate] = (perDay[i.localDate] ?? 0) + 1));
    Object.values(perDay).forEach((n) => expect(n).toBeLessThanOrEqual(cfg.dailyCap));
    const tomorrow = addDaysISO(TODAY, 1);
    const t = plan.items.filter((i) => i.localDate === tomorrow).map((i) => i.type);
    expect(t).toEqual(['daily_guidance', 'period_confirmation']);
    expect(plan.skips).toContainEqual({ localDate: tomorrow, type: 'symptom_checkin', reason: 'daily_cap' });
  });

  it('counts what was already sent today toward the cap', () => {
    const sent: SentRecord[] = [{ contentId: 'general_steady', localDate: TODAY, type: 'daily_guidance', at: NOW.getTime() - 1 }];
    const plan = buildPlan(input({ sent, prefs: { ...input().prefs, eveningCheckin: true }, dailyLogs: {} }));
    expect(todays(plan).filter((i) => i.type === 'daily_guidance')).toHaveLength(0);
    expect(todays(plan).map((i) => i.type)).toEqual(['symptom_checkin']);
  });

  it('is idempotent: re-running yields the same event ids, one per day and type', () => {
    const a = buildPlan(input());
    const b = buildPlan(input());
    expect(a.items.map((i) => i.eventId)).toEqual(b.items.map((i) => i.eventId));
    const ids = a.items.map((i) => i.eventId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe(eventIdFor('user-1', TODAY, 'daily_guidance', lib.version));
  });

  it('plans one primary message per day by default', () => {
    const plan = buildPlan(input());
    expect(plan.items).toHaveLength(cfg.planDays);
    expect(plan.items.every((i) => i.type === 'daily_guidance')).toBe(true);
  });
});

describe('AT-09 quiet hours and timing', () => {
  it('moves a daily time inside quiet hours to the end of the quiet window', () => {
    const plan = buildPlan(input({ prefs: { ...input().prefs, dailyHour: 22 } }));
    plan.items.forEach((i) => expect(new Date(i.at).getHours()).toBe(cfg.quietEndHour));
  });

  it('skips an evening reminder that would land in quiet hours', () => {
    const plan = buildPlan(input({ prefs: { ...input().prefs, eveningCheckin: true, eveningHour: 21, eveningMinute: 30 } }));
    expect(plan.items.some((i) => i.type === 'symptom_checkin')).toBe(false);
    expect(plan.skips.some((s) => s.reason === 'quiet_hours')).toBe(true);
  });

  it('detects quiet hours across midnight', () => {
    expect(isQuietNow(new Date(2026, 10, 11, 23, 0), cfg)).toBe(true);
    expect(isQuietNow(new Date(2026, 10, 11, 6, 0), cfg)).toBe(true);
    expect(isQuietNow(new Date(2026, 10, 11, 8, 0), cfg)).toBe(false);
    expect(isQuietNow(new Date(2026, 10, 11, 20, 59), cfg)).toBe(false);
  });

  it('never sends a late push: after the daily time it is offered in the app only', () => {
    const plan = buildPlan(input({ now: new Date(2026, 10, 11, 11, 0) }));
    expect(primaryToday(plan).channel).toBe('in_app');
    plan.items.filter((i) => i.localDate > TODAY).forEach((i) => expect(i.channel).toBe('push'));
  });

  it('schedules at the chosen local time', () => {
    const plan = buildPlan(input({ prefs: { ...input().prefs, dailyHour: 10, dailyMinute: 0 } }));
    plan.items.forEach((i) => {
      const d = new Date(i.at);
      expect([d.getHours(), d.getMinutes()]).toEqual([10, 0]);
    });
  });

  it('skips the evening check-in on a day she already logged', () => {
    const plan = buildPlan(input({ prefs: { ...input().prefs, eveningCheckin: true } }));
    expect(todays(plan).some((i) => i.type === 'symptom_checkin')).toBe(false);
    expect(plan.skips).toContainEqual({ localDate: TODAY, type: 'symptom_checkin', reason: 'already_logged' });
  });
});

describe('AT-11 / AT-12 changes to her data and preferences', () => {
  it('replaces planned content when the period date changes (same event id)', () => {
    const before = primaryToday(buildPlan(input({ cycle: cycle(8) })));
    const after = primaryToday(buildPlan(input({ cycle: cycle(2) })));
    expect(after.eventId).toBe(before.eventId);
    expect(after.phase).toBe('menstrual');
    expect(after.contentId).not.toBe(before.contentId);
  });

  it('revalidates an item at show time and never shows stale phase advice', () => {
    const planned = primaryToday(buildPlan(input({ cycle: cycle(8) })));
    const fresh = revalidate(planned, input({ cycle: cycle(1) }))!;
    expect(fresh.eventId).toBe(planned.eventId);
    expect(fresh.phase).toBe('menstrual');
    expect(fresh.contentId.startsWith('menstrual_')).toBe(true);
  });

  it('keeps the original when it is still valid', () => {
    const planned = primaryToday(buildPlan(input({ cycle: cycle(8) })));
    expect(revalidate(planned, input({ cycle: cycle(8) }))!.contentId).toBe(planned.contentId);
  });

  it('plans nothing when notifications are off', () => {
    const plan = buildPlan(input({ prefs: { ...input().prefs, enabled: false } }));
    expect(plan.items).toHaveLength(0);
    expect(plan.skips[0].reason).toBe('notifications_off');
  });

  it('only plans optional reminders she turned on', () => {
    const plan = buildPlan(input({ cycle: cycle(28), dailyLogs: {} }));
    expect(plan.items.some((i) => i.type !== 'daily_guidance')).toBe(false);
  });
});

describe('AT-14 lock-screen privacy', () => {
  it('uses a neutral lock-screen body and a neutral title where the title is sensitive', () => {
    const plan = buildPlan(input({ cycle: cycle(28), dailyLogs: {}, prefs: { ...input().prefs, periodConfirm: true } }));
    plan.items.forEach((i) => {
      expect(i.lockBody).toBe(cfg.neutralLockBody);
      expect(i.lockTitle).not.toMatch(/period|cramp|ovulat|bleed|pain|low|crav/i);
    });
  });
});

describe('AT-15 no repetitive content', () => {
  it('does not repeat a message within the rotation window when alternatives exist', () => {
    // A long luteal stretch: days 16–22, all luteal, no logs after today.
    const plan = buildPlan(input({ cycle: cycle(16) }));
    const ids = plan.items.map((i) => i.contentId);
    for (let i = 0; i < ids.length; i++) {
      const window = ids.slice(Math.max(0, i - (cfg.rotationDays - 1)), i);
      const pool = lib.messages.filter((m) => m.trigger === 'phase' && m.phases?.includes(plan.items[i].phase!)).length;
      if (pool >= cfg.rotationDays) expect(window).not.toContain(ids[i]);
    }
  });

  it('rotates by least-recently-used, taking sent history into account', () => {
    const sent: SentRecord[] = [
      { contentId: 'follicular_win', localDate: addDaysISO(TODAY, -1), type: 'daily_guidance', at: 0 },
    ];
    expect(primaryToday(buildPlan(input({ sent }))).contentId).not.toBe('follicular_win');
  });

  it('falls back deterministically when everything is in cooldown', () => {
    const general = lib.messages.filter((m) => m.trigger === 'general').map((m) => m.id);
    const sent: SentRecord[] = general.map((id, i) => ({ contentId: id, localDate: addDaysISO(TODAY, -1 - i), type: 'daily_guidance', at: 0 }));
    const c = { ...cycle(8), mode: 'pcos_irregular' as const };
    const a = primaryToday(buildPlan(input({ cycle: c, sent })));
    const b = primaryToday(buildPlan(input({ cycle: c, sent })));
    expect(a.contentId).toBe(b.contentId);
    expect(a.contentId).toBe(general[general.length - 1]); // the least recently used
  });
});

describe('content library', () => {
  it('ships valid copy for every link and type', () => {
    expect(parseLibrary(BUNDLED_LIBRARY)).not.toBeNull();
    const ids = lib.messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects malformed remote libraries and fills missing config from the bundle', () => {
    expect(parseLibrary(null)).toBeNull();
    expect(parseLibrary({ version: 2, messages: [] })).toBeNull();
    const parsed = parseLibrary({ version: 2, config: { dailyCap: 1 }, messages: lib.messages })!;
    expect(parsed.config.dailyCap).toBe(1);
    expect(parsed.config.quietStartHour).toBe(cfg.quietStartHour);
  });

  it('never selects a paused message', () => {
    const paused: NotificationLibrary = {
      ...lib,
      messages: lib.messages.map((m) => (m.id === 'follicular_win' ? { ...m, paused: true } : m)),
    };
    buildPlan(input({ library: paused })).items.forEach((i) => expect(i.contentId).not.toBe('follicular_win'));
  });

  it('only applies symptom signals to today and tomorrow', () => {
    const ctx = dayContext(input({ dailyLogs: { [TODAY]: log(TODAY, 'low', ['cramps']) } }), addDaysISO(TODAY, 3));
    expect(ctx.signals.has('cramps')).toBe(false);
    expect(ctx.signals.has('low_mood')).toBe(false);
  });
});

describe('AT-07 / AT-08 pop-up de-duplication and deep links', () => {
  const base = primaryToday(buildPlan(input({ now: new Date(2026, 10, 11, 11, 0) })));
  const item = (over: Partial<LedgerItem>): Record<string, LedgerItem> => ({
    [base.eventId]: { ...base, status: 'planned', pushScheduled: false, ...over },
  });
  const at11 = new Date(2026, 10, 11, 11, 0);

  it('shows an in-app item once its time has come', () => {
    expect(pickPopupItem(item({}), at11, null, cfg)?.eventId).toBe(base.eventId);
  });

  it('does not pop up right after she tapped a push', () => {
    expect(pickPopupItem(item({}), at11, at11.getTime() - 60_000, cfg)).toBeNull();
    expect(pickPopupItem(item({}), at11, at11.getTime() - TAP_SUPPRESS_MS - 1, cfg)).not.toBeNull();
  });

  it('never resurfaces an opened or dismissed event, or a push already delivered in the background', () => {
    expect(pickPopupItem(item({ status: 'opened' }), at11, null, cfg)).toBeNull();
    expect(pickPopupItem(item({ status: 'dismissed' }), at11, null, cfg)).toBeNull();
    expect(pickPopupItem(item({ status: 'sent', pushScheduled: true }), at11, null, cfg)).toBeNull();
    expect(pickPopupItem(item({ status: 'sent', pushScheduled: true, receivedForeground: true }), at11, null, cfg)).not.toBeNull();
  });

  it('stays quiet during quiet hours', () => {
    expect(pickPopupItem(item({}), new Date(2026, 10, 11, 22, 0), null, cfg)).toBeNull();
  });

  it('maps every link to a known route', () => {
    const links = Array.from(new Set(lib.messages.map((m) => m.link)));
    const known = ['/(tabs)/today', '/nutrition', '/check-in', '/(tabs)/plan', '/(tabs)/phases', '/onboarding/cycle'];
    links.forEach((l) => {
      const r = routeForLink(l, 'luteal', true);
      expect(known.some((k) => r.startsWith(k))).toBe(true);
    });
    expect(routeForLink('nutrition_phase', 'menstrual', true)).toBe('/nutrition/menstrual');
    expect(routeForLink('cycle_setup', null, true)).toBe('/(tabs)/today?editPeriod=1');
    expect(routeForLink('cycle_setup', null, false)).toBe('/onboarding/cycle');
  });

  it('falls back safely for unknown routes, signed-out users and old notifications', () => {
    const ctx = { signedIn: true, todayISO: TODAY, phase: null, hasPeriodDate: true };
    expect(resolveTap({ link: 'admin_panel', localDate: TODAY }, ctx)).toEqual({ route: SAFE_HOME, notice: null });
    expect(resolveTap({ link: 'daily_planner', localDate: TODAY }, { ...ctx, signedIn: false }).route).toBe('/');
    expect(resolveTap({ link: 'daily_planner', localDate: addDaysISO(TODAY, -2) }, ctx)).toEqual({
      route: SAFE_HOME,
      notice: OUTDATED_NOTICE,
    });
    expect(resolveTap({ link: 'daily_planner', localDate: TODAY }, ctx).route).toBe('/(tabs)/plan');
  });
});

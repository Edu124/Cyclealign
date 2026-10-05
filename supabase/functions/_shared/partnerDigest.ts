// Partner Sync digest — pure logic, no imports. Used by BOTH the app (so the
// message updates the moment she opens it) and the `partner-digest-refresh`
// edge function (so her partner's message still rotates and follows her phase
// when she hasn't opened the app for days). Keeping one copy is what stops the
// two from drifting apart; partnerDigest.test.ts also checks it against the
// app's own prediction engine.

export type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type CapacityPhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal_early'
  | 'luteal_late';

/**
 * What her partner reads. Every phase has a pool of "doing okay" and "rough
 * day" messages, and one is picked per 2-day window — so even a long phase
 * never shows the same line for more than a couple of days, and the pool
 * itself changes the moment her phase does. Phrased as gentle tendencies,
 * never as certainties about how she feels.
 */
export const PARTNER_MESSAGES: Record<CapacityPhase, { good: string[]; tough: string[] }> = {
  menstrual: {
    tough: [
      "She's on her period 🌙 — energy and comfort may be low today. Extra patience, something warm to drink and a few things taken off her plate would mean a lot.",
      "She's in the first days of her period 🌙 and it may be a heavy one. A heating pad, her favourite comfort food or simply taking over dinner would go a long way.",
      "Her period is on 🌙 and she may want things slow and quiet. No big plans or pressure — just be around and easy to talk to.",
      "Rest matters most for her right now 🌙. Offer help before she has to ask, and let her set the pace today.",
    ],
    good: [
      "She's on her period 🌙 but feeling okay today — keep things gentle and low-pressure.",
      "Her period is on 🌙 but she's holding up well. A calm evening together or a short walk could be nice.",
      "She's feeling alright today even with her period 🌙 — still worth keeping plans light and flexible.",
      "A steadier day for her 🌙. Check in warmly, and let her tell you how much she's up for.",
    ],
  },
  follicular: {
    good: [
      "She's in her follicular phase 🌿 — energy tends to be rising and she may feel fresh. A great time for plans, new ideas and doing something fun together.",
      "Her energy is building 🌿 — she may be up for trying something new, a date out or a project you've both been putting off.",
      "She's in a brighter, more social stretch 🌿. Suggest something active or creative and she may well say yes.",
      "A good window to plan ahead together 🌿 — her mood and motivation often lift in this phase.",
    ],
    tough: [
      "She's in her follicular phase 🌿 but it's a rough day for her 💛 — a little extra kindness goes a long way.",
      "Even with her energy usually rising 🌿, today isn't an easy one for her 💛. Keep things simple and check in gently.",
      "Not her best day 💛 despite being in a brighter phase 🌿. Skip the big plans and just be supportive.",
      "A tougher day than usual for this phase 🌿 — listen first, fix later, and keep the pressure off 💛.",
    ],
  },
  ovulatory: {
    good: [
      "She's around ovulation ☀️ — energy and confidence often peak now. A great day to go out, have the bigger conversations and enjoy quality time.",
      "She may be feeling especially social and upbeat ☀️ — plan something together, dinner out or a day trip.",
      "Peak-energy stretch for her ☀️ — a good time for fun plans, honest chats and making memories.",
      "She's likely feeling confident and connected ☀️. Make time for her — she'll probably appreciate it.",
    ],
    tough: [
      "She's around ovulation ☀️ but it's a rough day for her 💛 — check in gently and keep the pressure off.",
      "Even in a high-energy phase ☀️, today is hard for her 💛. Be patient and don't push plans on her.",
      "Not feeling as bright as usual for this phase ☀️ — a quiet, kind day together may be best 💛.",
      "A harder day than expected ☀️. Ask what would help, and let her say no to plans without guilt 💛.",
    ],
  },
  luteal_early: {
    good: [
      "She's in her early luteal phase 🍂 — steady and focused. Calm time together works well; maybe skip big surprises.",
      "She may be in a productive, get-things-done groove 🍂. Help with a to-do list or share a quiet, cosy evening.",
      "A settled stretch for her 🍂 — good for routines, home projects and low-key time together.",
      "Her energy is evening out 🍂. Familiar, comfortable plans tend to land better than anything hectic.",
    ],
    tough: [
      "She's in her early luteal phase 🍂 but it's a rough day for her 💛 — keep things calm and be patient.",
      "Today feels heavier than usual for her 🍂💛. Take a few chores off her list and keep the evening easy.",
      "She may be more easily overwhelmed today 🍂 — fewer decisions and a bit of extra patience would help 💛.",
      "A tougher day in a steady phase 🍂. Gentle check-ins beat big gestures right now 💛.",
    ],
  },
  luteal_late: {
    tough: [
      "She's in her late luteal phase 🍂 — energy tends to dip and feelings can sit closer to the surface before her period. Patience, comfort and no pressure would go a long way.",
      "Her period may be close 🍂 and she could be feeling tired or tender. Be kind, keep plans minimal and snacks on hand.",
      "This stretch before her period can feel heavy 🍂. Reassurance, a lighter schedule and not taking little things personally would help.",
      "She may need more rest and quiet than usual 🍂 — offer support without asking for explanations.",
    ],
    good: [
      "She's in her late luteal phase 🍂 but feeling okay today — still worth keeping things easy and kind.",
      "A good day for her despite the run-up to her period 🍂 — enjoy it, but keep plans flexible.",
      "She's doing alright today 🍂 — a relaxed evening and a bit of extra warmth are always welcome.",
      "Holding steady before her period 🍂. Small gestures, like a favourite snack or a movie night, can mean a lot.",
    ],
  },
};

const CAPACITY_LOW: Record<CapacityPhase, boolean> = {
  menstrual: true,
  follicular: false,
  ovulatory: false,
  luteal_early: false,
  luteal_late: true,
};

const MS_PER_DAY = 86_400_000;

function isoToDays(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

function daysToIso(days: number): string {
  return new Date(days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Index of the 2-day window a calendar date falls in — drives how often the message rotates. */
export function partnerMessageBucket(dateISO: string): number {
  return Math.floor(isoToDays(dateISO) / 2);
}

export function pickPartnerMessage(phase: CapacityPhase, toughDay: boolean, dateISO: string): string {
  const pool = PARTNER_MESSAGES[phase][toughDay ? 'tough' : 'good'];
  return pool[partnerMessageBucket(dateISO) % pool.length];
}

/**
 * "Tough day" leans on the phase-based capacity model, but a Quick Log from
 * today (if she's made one) overrides it — how she's actually doing beats a
 * generic guess.
 */
export function isToughDay(
  phase: CapacityPhase,
  todaysLog: { energy: number; mood: string } | null | undefined,
): boolean {
  const loggedRough = !!todaysLog && (todaysLog.energy <= 2 || ['rough', 'low'].includes(todaysLog.mood));
  const loggedGood = !!todaysLog && todaysLog.energy >= 4 && !['rough', 'low'].includes(todaysLog.mood);
  return loggedRough ? true : loggedGood ? false : CAPACITY_LOW[phase];
}

// ── Server-side prediction ───────────────────────────────────────────────────
// A port of the app's LocalStatisticalEngine + capacityPhaseFromDay, reduced
// to what the digest needs. The test file compares it with the real engine.

const MIN_CYCLE = 21;
const MAX_CYCLE = 45;

function clampCycle(value: number): number {
  if (Number.isNaN(value)) return 28;
  return Math.round(Math.min(MAX_CYCLE, Math.max(MIN_CYCLE, value)));
}

function effectiveCycleLength(avgCycleLength: number, starts: string[]): number {
  const sorted = starts.filter(Boolean).slice().sort();
  if (sorted.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const gap = isoToDays(sorted[i]) - isoToDays(sorted[i - 1]);
      if (gap >= MIN_CYCLE && gap <= MAX_CYCLE) gaps.push(gap);
    }
    if (gaps.length > 0) return clampCycle(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }
  return clampCycle(avgCycleLength);
}

/** Capacity phase (menstrual / follicular / ovulatory / early or late luteal) for a date. */
export function capacityPhaseForDate(input: {
  lastPeriodStart: string;
  avgCycleLength: number;
  avgPeriodLength: number;
  periodStarts: string[];
  todayISO: string;
}): CapacityPhase {
  const cycleLength = effectiveCycleLength(input.avgCycleLength, input.periodStarts);
  const periodLength = Math.max(2, Math.min(input.avgPeriodLength || 5, 10));

  let elapsed = isoToDays(input.todayISO) - isoToDays(input.lastPeriodStart);
  while (elapsed > cycleLength) elapsed -= cycleLength;
  if (elapsed < 0) elapsed = 0;
  const dayOfCycle = Math.min(elapsed + 1, cycleLength);

  const ovulationDay = Math.max(periodLength + 2, cycleLength - 14);
  const ovStart = Math.max(periodLength + 1, ovulationDay - 1);
  const ovEnd = Math.min(cycleLength - 1, ovulationDay + 1);

  if (dayOfCycle <= periodLength) return 'menstrual';
  if (dayOfCycle <= ovStart - 1) return 'follicular';
  if (dayOfCycle <= ovEnd) return 'ovulatory';
  const lutealStart = ovEnd + 1;
  const mid = (lutealStart + cycleLength) / 2;
  return dayOfCycle <= mid ? 'luteal_early' : 'luteal_late';
}

export const CAPACITY_TO_PHASE_KEY: Record<CapacityPhase, PhaseKey> = {
  menstrual: 'menstrual',
  follicular: 'follicular',
  ovulatory: 'ovulation',
  luteal_early: 'luteal',
  luteal_late: 'luteal',
};

export function addDaysToIso(iso: string, days: number): string {
  return daysToIso(isoToDays(iso) + days);
}

// ── Adaptive (irregular / perimenopause) users ───────────────────────────────
// For these users CycleAlign never claims a cycle phase, so their partner reads
// a message built only from how she is doing today — no phase, no hormones.

export type AdaptiveMode = 'regular' | 'pcos_irregular' | 'perimenopause';

/** Same routing as the app's resolveMode — kept here so the server job can't disagree with the app. */
export function resolveModeFromAnswers(regularity?: string | null, context?: string | null): AdaptiveMode {
  if (context === 'PERIMENOPAUSE' || regularity === 'CHANGING') return 'perimenopause';
  if (
    context === 'PCOS' ||
    context === 'IRREGULAR' ||
    context === 'POSTPARTUM' ||
    regularity === 'IRREGULAR' ||
    regularity === 'UNKNOWN'
  ) {
    return 'pcos_irregular';
  }
  return 'regular';
}

export const ADAPTIVE_PARTNER_MESSAGES: Record<'good' | 'tough' | 'unknown', string[]> = {
  good: [
    "She's feeling well today 🌿 — a good day to connect, make plans or just enjoy time together.",
    'Things are going smoothly for her today ✨ — a nice moment for a catch-up or something fun.',
    "She's in good spirits and has energy to spare 🌞 — worth checking in warmly.",
    'A steadier, brighter day for her 🌿 — she may welcome company or a shared plan.',
  ],
  tough: [
    "It's a harder day for her 💛 — extra patience, fewer demands and a bit of kindness would mean a lot.",
    'She may be running low today 💛 — offer help before she has to ask, and keep plans light.',
    'Today might ask a lot of her 💛 — a quiet evening and a few things taken off her plate would help.',
    "Not her easiest day 💛 — check in gently and let her set the pace.",
  ],
  unknown: [
    "She's keeping you in the loop 🌿 — a gentle check-in is always welcome.",
    'No big signals today 🌿 — a kind word or a small gesture never goes unnoticed.',
    "She hasn't flagged anything today — a warm hello is always a good idea 💛.",
    'A quiet day on her end 🌿 — be around, and let her lead.',
  ],
};

/** How she is today, from her own check-in only. 'unknown' when there's nothing to go on. */
export function adaptiveTone(
  log: { energy: number; mood: string; sleepQuality?: number | null } | null | undefined,
): 'good' | 'tough' | 'unknown' {
  if (!log) return 'unknown';
  const lowMood = ['rough', 'low'].includes(log.mood);
  if (log.energy <= 2 || lowMood || (log.sleepQuality != null && log.sleepQuality <= 2 && log.energy <= 3)) return 'tough';
  if (log.energy >= 4 && !lowMood) return 'good';
  return 'unknown';
}

export function pickAdaptiveMessage(tone: 'good' | 'tough' | 'unknown', dateISO: string): string {
  const pool = ADAPTIVE_PARTNER_MESSAGES[tone];
  return pool[partnerMessageBucket(dateISO) % pool.length];
}

import type { CycleLog, DailyLog, PhaseKey, Prediction } from '@/types/models';
import type { AdaptiveMode } from '@/lib/adaptive/types';
import type { PhaseReliability } from '@/lib/adaptive/mode';
import { predictionEngine } from '@/lib/prediction/engine';
import { addDaysISO, daysBetween, fromISODate, todayISO } from '@/lib/dates';
import type {
  LinkKey,
  NotificationConfig,
  NotificationLibrary,
  NotificationMessage,
  NotificationType,
  Trigger,
} from './library';

/**
 * The single notification decision service. Pure: given her data, preferences
 * and what was already sent, it returns exactly what should be scheduled for
 * the coming days and why anything was skipped. Push scheduling and the
 * in-app pop-up both read from this plan, so the two channels never disagree.
 */

// ── Inputs ────────────────────────────────────────────────────────────────────

export interface NotificationPrefsInput {
  enabled: boolean;
  dailyHour: number;
  dailyMinute: number;
  eveningCheckin: boolean;
  eveningHour: number;
  eveningMinute: number;
  periodConfirm: boolean;
}

export interface CycleInput {
  mode: AdaptiveMode;
  reliability: PhaseReliability;
  lastPeriodStart: string | null;
  avgCycleLength: number;
  avgPeriodLength: number;
  history: CycleLog[];
}

/** A message that has already gone out (its time has passed). */
export interface SentRecord {
  contentId: string;
  localDate: string;
  type: NotificationType;
  at: number;
}

export interface PlanInput {
  now: Date;
  userKey: string;
  library: NotificationLibrary;
  prefs: NotificationPrefsInput;
  cycle: CycleInput;
  dailyLogs: Record<string, DailyLog>;
  sent: SentRecord[];
  /** Interruptive extras (e.g. Retail Therapy) already shown today. */
  extrasToday?: number;
}

// ── Outputs ───────────────────────────────────────────────────────────────────

export type Confidence = 'none' | 'stale' | 'neutral' | 'low' | 'ok';
export type Channel = 'push' | 'in_app';

export interface PlannedItem {
  /** Stable event id = idempotency key: user + local date + type + content version. */
  eventId: string;
  type: NotificationType;
  contentId: string;
  contentVersion: number;
  localDate: string;
  /** Local fire time, epoch ms. */
  at: number;
  /** 'in_app' = only shown inside the app (its push time has already passed). */
  channel: Channel;
  phase: PhaseKey | null;
  confidence: Confidence;
  trigger: Trigger;
  link: LinkKey;
  title: string;
  body: string;
  lockTitle: string;
  lockBody: string;
  cta: string;
}

export interface SkipRecord {
  localDate: string;
  type: NotificationType;
  reason: string;
}

export interface Plan {
  items: PlannedItem[];
  skips: SkipRecord[];
  today: { phase: PhaseKey | null; confidence: Confidence; dayOfCycle: number | null };
}

// ── Cycle confidence ──────────────────────────────────────────────────────────

const URGENT_SYMPTOMS = ['severe_pain', 'heavy_bleeding'];
const LOW_MOODS = ['rough', 'low'];
const POSITIVE_MOODS = ['good', 'great'];

function predictOn(cycle: CycleInput, dateISO: string): Prediction | null {
  if (!cycle.lastPeriodStart) return null;
  return predictionEngine.predict({
    lastPeriodStart: cycle.lastPeriodStart,
    avgCycleLength: cycle.avgCycleLength,
    avgPeriodLength: cycle.avgPeriodLength,
    history: cycle.history,
    now: fromISODate(dateISO),
  });
}

/**
 * How much the calendar estimate may be trusted on a date.
 *  none    — regular user with no period date: no phase, offer setup once.
 *  stale   — the last logged period is long past due: ask for an update.
 *  neutral — irregular / perimenopause / variable cycles: no phase claims.
 *  low     — a single logged cycle: phase as an estimate, no ovulation copy.
 *  ok      — two or more logged cycles on a regular pattern.
 */
export function cycleConfidence(
  cycle: CycleInput,
  dateISO: string,
  config: NotificationConfig,
  prediction: Prediction | null,
): Confidence {
  if (cycle.mode !== 'regular' || cycle.reliability !== 'reliable') return 'neutral';
  if (!cycle.lastPeriodStart || !prediction) return 'none';
  const since = daysBetween(fromISODate(cycle.lastPeriodStart), fromISODate(dateISO));
  if (since >= prediction.cycleLength + config.staleAfterDaysPastDue) return 'stale';
  const starts = new Set(cycle.history.map((c) => c.startDate).filter(Boolean));
  starts.add(cycle.lastPeriodStart);
  return starts.size >= 2 ? 'ok' : 'low';
}

// ── Day context ───────────────────────────────────────────────────────────────

export interface DayContext {
  dateISO: string;
  phase: PhaseKey | null;
  confidence: Confidence;
  daysToPeriod: number | null;
  /** Triggers that hold for this day, from what she actually logged. */
  signals: Set<Trigger>;
}

/**
 * Builds the context for one day. Symptom and mood signals come only from
 * what she logged (that day or the day before) and are only applied to today
 * and tomorrow — never guessed for days further out.
 */
export function dayContext(input: PlanInput, dateISO: string): DayContext {
  const { cycle, library, dailyLogs, now } = input;
  const today = todayISO(now);
  const prediction = predictOn(cycle, dateISO);
  const confidence = cycleConfidence(cycle, dateISO, library.config, prediction);
  const phaseKnown = confidence === 'low' || confidence === 'ok';
  const signals = new Set<Trigger>();

  const offset = daysBetween(fromISODate(today), fromISODate(dateISO));
  if (offset <= 1) {
    const sameDay = dateISO <= today ? dailyLogs[dateISO] : undefined;
    const dayBefore = dailyLogs[addDaysISO(dateISO, -1)];
    const recent = sameDay ?? dayBefore;
    if (recent) {
      const symptoms = recent.symptoms ?? [];
      if (symptoms.some((s) => URGENT_SYMPTOMS.includes(s)) || recent.bleeding === 'heavy') signals.add('urgent');
      if (symptoms.includes('cramps')) signals.add('cramps');
      if (LOW_MOODS.includes(recent.mood)) signals.add('low_mood');
      if (symptoms.includes('cravings')) signals.add('cravings');
      if (POSITIVE_MOODS.includes(recent.mood)) signals.add('positive_mood');
    }
    const lookback = [dateISO, addDaysISO(dateISO, -1), addDaysISO(dateISO, -2)].filter((d) => d <= today);
    if (!lookback.some((d) => dailyLogs[d]?.mood)) signals.add('mood_missing');
  }
  if (confidence === 'none') signals.add('no_data');
  if (confidence === 'stale') signals.add('stale');
  if (phaseKnown) signals.add('phase');
  signals.add('general');

  return {
    dateISO,
    phase: phaseKnown && prediction ? prediction.currentPhase : null,
    confidence,
    daysToPeriod: phaseKnown && prediction ? prediction.daysUntilNextPeriod : null,
    signals,
  };
}

// ── Message selection ─────────────────────────────────────────────────────────

/** Priority order for the one daily message. */
export const TRIGGER_ORDER: Trigger[] = [
  'urgent',
  'no_data',
  'stale',
  'cramps',
  'low_mood',
  'cravings',
  'positive_mood',
  'mood_missing',
  'phase',
  'general',
];

/** Could this message be sent on this day at all (ignoring repetition)? */
export function isEligible(m: NotificationMessage, ctx: DayContext): boolean {
  if (m.paused || m.type !== 'daily_guidance') return false;
  if (!ctx.signals.has(m.trigger)) return false;
  if (m.phases && m.phases.length) {
    // A phase-specific message needs a known phase that matches. Messages
    // whose copy makes no phase claim may also go out when no phase is known.
    if (ctx.phase) {
      if (!m.phases.includes(ctx.phase)) return false;
    } else if (m.trigger === 'phase') {
      return false;
    }
  }
  if (m.minConfidence === 'ok' && ctx.confidence !== 'ok') return false;
  if (m.maxDaysToPeriod != null && (ctx.daysToPeriod == null || ctx.daysToPeriod > m.maxDaysToPeriod)) return false;
  return true;
}

function lastUse(history: SentRecord[], id: string): string | null {
  let last: string | null = null;
  for (const h of history) if (h.contentId === id && (!last || h.localDate > last)) last = h.localDate;
  return last;
}

/** Least recently used first; never-used messages keep library order. */
function pickLRU(candidates: NotificationMessage[], history: SentRecord[]): NotificationMessage {
  let best = candidates[0];
  let bestUse = lastUse(history, best.id);
  for (const m of candidates.slice(1)) {
    const use = lastUse(history, m.id);
    if (bestUse === null) break;
    if (use === null || use < bestUse) {
      best = m;
      bestUse = use;
    }
  }
  return best;
}

export function selectDailyMessage(
  library: NotificationLibrary,
  ctx: DayContext,
  history: SentRecord[],
): NotificationMessage | null {
  const inCooldown = (m: NotificationMessage) => {
    const last = lastUse(history, m.id);
    if (!last) return false;
    const days = m.cooldownDays ?? library.config.rotationDays;
    return daysBetween(fromISODate(last), fromISODate(ctx.dateISO)) < days;
  };
  for (const trigger of TRIGGER_ORDER) {
    if (!ctx.signals.has(trigger)) continue;
    const fresh = library.messages.filter((m) => m.trigger === trigger && isEligible(m, ctx) && !inCooldown(m));
    if (fresh.length) return pickLRU(fresh, history);
  }
  // Deterministic fallback: the least recently used general message, even if
  // it is still in its rotation window — there is no safer alternative.
  const general = library.messages.filter((m) => m.trigger === 'general' && isEligible(m, ctx));
  return general.length ? pickLRU(general, history) : null;
}

// ── Time helpers ──────────────────────────────────────────────────────────────

export function inQuietHours(hour: number, config: NotificationConfig): boolean {
  const { quietStartHour: s, quietEndHour: e } = config;
  return s > e ? hour >= s || hour < e : hour >= s && hour < e;
}

export function isQuietNow(now: Date, config: NotificationConfig): boolean {
  return inQuietHours(now.getHours(), config);
}

function localTime(dateISO: string, hour: number, minute: number): Date {
  const d = fromISODate(dateISO);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function eventIdFor(userKey: string, localDate: string, type: NotificationType, version: number): string {
  return `ca:${userKey}:${localDate}:${type}:v${version}`;
}

// ── The plan ──────────────────────────────────────────────────────────────────

const TYPE_PRIORITY: NotificationType[] = ['daily_guidance', 'period_confirmation', 'symptom_checkin'];

export function buildPlan(input: PlanInput): Plan {
  const { now, library, prefs, userKey } = input;
  const config = library.config;
  const today = todayISO(now);
  const todayCtx = dayContext(input, today);
  const todayPrediction = predictOn(input.cycle, today);
  const result: Plan = {
    items: [],
    skips: [],
    today: {
      phase: todayCtx.phase,
      confidence: todayCtx.confidence,
      dayOfCycle: todayCtx.phase && todayPrediction ? todayPrediction.dayOfCycle : null,
    },
  };
  if (!prefs.enabled) {
    result.skips.push({ localDate: today, type: 'daily_guidance', reason: 'notifications_off' });
    return result;
  }

  const history: SentRecord[] = [...input.sent];
  const sentOn = (date: string, type: NotificationType) =>
    input.sent.some((s) => s.localDate === date && s.type === type);

  for (let offset = 0; offset < config.planDays; offset++) {
    const date = addDaysISO(today, offset);
    const ctx = offset === 0 ? todayCtx : dayContext(input, date);
    const day: PlannedItem[] = [];

    const make = (m: NotificationMessage, at: Date, channel: Channel): PlannedItem => ({
      eventId: eventIdFor(userKey, date, m.type, library.version),
      type: m.type,
      contentId: m.id,
      contentVersion: m.version,
      localDate: date,
      at: at.getTime(),
      channel,
      phase: ctx.phase,
      confidence: ctx.confidence,
      trigger: m.trigger,
      link: m.link,
      title: m.title,
      body: m.body,
      lockTitle: m.lockTitle ?? m.title,
      lockBody: config.neutralLockBody,
      cta: m.cta,
    });

    // 1. The one primary daily message.
    if (sentOn(date, 'daily_guidance')) {
      result.skips.push({ localDate: date, type: 'daily_guidance', reason: 'already_sent_today' });
    } else {
      let at = localTime(date, prefs.dailyHour, prefs.dailyMinute);
      // Quiet hours: queue to the end of the quiet window, same day.
      if (inQuietHours(at.getHours(), config)) at = localTime(date, config.quietEndHour, 0);
      const m = selectDailyMessage(library, ctx, history);
      if (!m) {
        result.skips.push({ localDate: date, type: 'daily_guidance', reason: 'no_suitable_content' });
      } else if (at.getTime() <= now.getTime()) {
        // Its push time has passed today: offer it in the app only, never as a late push.
        day.push(make(m, at, 'in_app'));
      } else {
        day.push(make(m, at, 'push'));
      }
      if (m) history.push({ contentId: m.id, localDate: date, type: 'daily_guidance', at: at.getTime() });
    }

    // 2. Optional reminders — only the ones she turned on.
    const evening = localTime(date, prefs.eveningHour, prefs.eveningMinute);
    const reminder = (type: NotificationType) =>
      library.messages.find((m) => m.type === type && m.trigger === 'reminder' && !m.paused);

    if (prefs.periodConfirm) {
      const p = predictOn(input.cycle, date);
      const m = reminder('period_confirmation');
      const regular = ctx.confidence === 'low' || ctx.confidence === 'ok';
      // The day after the estimated start, only while no new period is logged.
      if (p && m && regular && p.isOverdue && p.dayOfCycle === 2) {
        if (inQuietHours(evening.getHours(), config)) {
          result.skips.push({ localDate: date, type: 'period_confirmation', reason: 'quiet_hours' });
        } else if (evening.getTime() > now.getTime() && !sentOn(date, 'period_confirmation')) {
          day.push(make(m, evening, 'push'));
        }
      }
    }

    if (prefs.eveningCheckin) {
      const m = reminder('symptom_checkin');
      if (!m) {
        // paused centrally
      } else if (date === today && input.dailyLogs[today]?.mood) {
        result.skips.push({ localDate: date, type: 'symptom_checkin', reason: 'already_logged' });
      } else if (inQuietHours(evening.getHours(), config)) {
        result.skips.push({ localDate: date, type: 'symptom_checkin', reason: 'quiet_hours' });
      } else if (evening.getTime() > now.getTime() && !sentOn(date, 'symptom_checkin')) {
        day.push(make(m, evening, 'push'));
      }
    }

    // 3. Daily cap across everything for the day (already-sent items count too).
    const alreadySent = input.sent.filter((s) => s.localDate === date).length;
    const extras = date === today ? input.extrasToday ?? 0 : 0;
    const room = Math.max(0, config.dailyCap - alreadySent - extras);
    day.sort((a, b) => TYPE_PRIORITY.indexOf(a.type) - TYPE_PRIORITY.indexOf(b.type));
    day.forEach((item, i) => {
      if (i < room) result.items.push(item);
      else result.skips.push({ localDate: date, type: item.type, reason: 'daily_cap' });
    });
  }
  return result;
}

/**
 * Send-time revalidation for an item that is about to be shown (in-app
 * pop-up or a tapped push). If her data changed since it was planned (a new
 * period date, a fresh log), the content is re-picked so stale advice is
 * never shown as current. The event id stays the same.
 */
export function revalidate(item: PlannedItem, input: PlanInput): PlannedItem | null {
  if (item.type !== 'daily_guidance') return item;
  const ctx = dayContext(input, item.localDate);
  const current = input.library.messages.find((m) => m.id === item.contentId);
  const priorHistory = input.sent.filter((s) => s.localDate < item.localDate);
  const best = selectDailyMessage(input.library, ctx, priorHistory);
  if (!best) return null;
  // Keep the original only if it is still eligible AND nothing more relevant
  // (an urgent signal or a fresh symptom) now outranks it.
  const rank = (t: Trigger) => TRIGGER_ORDER.indexOf(t);
  const keep = current && isEligible(current, ctx) && rank(current.trigger) <= rank(best.trigger);
  const m = keep ? current! : best;
  return {
    ...item,
    contentId: m.id,
    contentVersion: m.version,
    phase: ctx.phase,
    confidence: ctx.confidence,
    trigger: m.trigger,
    link: m.link,
    title: m.title,
    body: m.body,
    lockTitle: m.lockTitle ?? m.title,
    cta: m.cta,
  };
}

import type { DailyLog } from '@/types/models';
import { addDaysISO, fromISODate } from '@/lib/dates';
import { evaluateReadiness, predictReadiness } from './readiness';
import type { PhasePrior } from './readiness';
import type { PhaseReliability } from './mode';
import type { AdaptiveMode, Confidence, Readiness, ReadinessLevel, ReadinessType } from './types';
import { READINESS_TYPE_LABEL } from './types';

export interface SlotEvent {
  id: string;
  title?: string;
  categoryId: string;
  dateISO: string;
  /** Minutes from midnight. Events without times (all-day, planned tasks) don't block a slot. */
  startMin?: number;
  endMin?: number;
}

export interface DecisionWindow {
  dateISO: string;
  startMin: number;
  endMin: number;
  readinessType: ReadinessType;
  readinessLevel: ReadinessLevel;
  confidence: Confidence;
  reasons: string[];
  sourceSignals: string[];
  /** Internal ranking value only. */
  score: number;
}

/** Which kind of readiness a calendar event needs. null = private, never scored. */
export function readinessTypeFor(categoryId: string, title = ''): ReadinessType | null {
  switch (categoryId) {
    case 'HIGH_CONVO':
    case 'DECISION':
      return 'DECISION';
    case 'DEEP_FOCUS':
      return /creativ|brainstorm|design|writ|ideat/i.test(title) ? 'CREATIVE' : 'FOCUS';
    case 'MEETING':
      return /network|mixer|conference|social|lunch|coffee/i.test(title) ? 'SOCIAL' : 'COMMUNICATION';
    case 'ADMIN':
      return 'RECOVERY';
    case 'PERSONAL':
      return null;
    default:
      return 'FOCUS';
  }
}

export const DEFAULT_DURATION: Record<ReadinessType, number> = {
  DECISION: 60,
  FOCUS: 90,
  CREATIVE: 90,
  COMMUNICATION: 45,
  SOCIAL: 60,
  RECOVERY: 30,
};

export interface DayContext {
  mode: AdaptiveMode;
  history: DailyLog[];
  todayISO: string;
  todayLog: DailyLog | undefined;
  /** Regular mode only: cycle-phase prior for a given date. */
  phaseFor?: (dateISO: string) => { prior: PhasePrior; reliability: PhaseReliability } | null;
}

/** Readiness for any day: lived (today), looked-ahead (from her own pattern) or, for regular users, cycle-informed. */
export function dayReadiness(dateISO: string, type: ReadinessType, ctx: DayContext): Readiness {
  const phase = ctx.phaseFor?.(dateISO) ?? null;
  if (dateISO === ctx.todayISO) {
    return evaluateReadiness({
      log: ctx.todayLog,
      type,
      mode: ctx.mode,
      phasePrior: phase?.prior ?? null,
      phaseReliability: phase?.reliability ?? 'none',
      history: ctx.history.filter((h) => h.dateISO !== ctx.todayISO),
    });
  }
  if (ctx.mode === 'regular') {
    return evaluateReadiness({
      log: null,
      type,
      mode: 'regular',
      phasePrior: phase?.prior ?? null,
      phaseReliability: phase?.reliability ?? 'none',
    });
  }
  return predictReadiness({ dateISO, type, history: ctx.history, todayISO: ctx.todayISO });
}

const WORK_START = 9 * 60;
const WORK_END = 18 * 60;

export function freeBlocks(
  events: SlotEvent[],
  dateISO: string,
  fromMin = WORK_START,
  toMin = WORK_END,
): [number, number][] {
  const busy = events
    .filter((e) => e.dateISO === dateISO && e.startMin !== undefined && e.endMin !== undefined)
    .map((e) => [e.startMin as number, e.endMin as number] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  const blocks: [number, number][] = [];
  let cursor = fromMin;
  for (const [s, e] of busy) {
    if (s > cursor) blocks.push([cursor, Math.min(s, toMin)]);
    cursor = Math.max(cursor, e);
    if (cursor >= toMin) break;
  }
  if (cursor < toMin) blocks.push([cursor, toMin]);
  return blocks.filter(([s, e]) => e > s);
}

export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export interface RankQuery {
  categoryId: string;
  title?: string;
  durationMin?: number;
  fromISO: string;
  days?: number;
  events: SlotEvent[];
  ctx: DayContext;
  /** Don't offer this event's own current day/time again. */
  excludeDateISO?: string;
}

/**
 * Best available slots for an event, best first (max 3). Days with no basis
 * for a recommendation are left out rather than guessed.
 */
export function rankWindows(q: RankQuery): DecisionWindow[] {
  const type = readinessTypeFor(q.categoryId, q.title);
  if (!type) return [];
  const duration = q.durationMin ?? DEFAULT_DURATION[type];
  const days = q.days ?? 10;
  const out: DecisionWindow[] = [];

  for (let i = 0; i < days; i++) {
    const dateISO = addDaysISO(q.fromISO, i);
    if (dateISO === q.excludeDateISO) continue;
    const dow = fromISODate(dateISO).getDay();
    const hasEvents = q.events.some((e) => e.dateISO === dateISO);
    if ((dow === 0 || dow === 6) && !hasEvents) continue;

    const r = dayReadiness(dateISO, type, q.ctx);
    if (r.level === 'INSUFFICIENT_DATA' || r.score === null) continue;

    // Today: don't offer a time that has already passed.
    const nowMin = dateISO === q.ctx.todayISO ? currentMinutes() : WORK_START;
    const blocks = freeBlocks(q.events, dateISO, Math.max(WORK_START, nowMin)).filter(([s, e]) => e - s >= duration);
    if (blocks.length === 0) continue;
    const block =
      type === 'FOCUS' || type === 'CREATIVE'
        ? blocks.reduce((best, b) => (b[1] - b[0] > best[1] - best[0] ? b : best))
        : blocks[0];

    const timed = q.events.filter((e) => e.dateISO === dateISO && e.startMin !== undefined).length;
    const penalty = timed >= 4 ? 0.08 : timed === 3 ? 0.04 : 0;
    const reasons = [...r.reasons];
    reasons.push(`Free ${formatMinutes(block[0])}–${formatMinutes(block[0] + duration)}`);
    if (penalty > 0) reasons.push(`A busier day — ${timed} timed events`);

    out.push({
      dateISO,
      startMin: block[0],
      endMin: block[0] + duration,
      readinessType: type,
      readinessLevel: r.level,
      confidence: r.confidence,
      reasons: reasons.slice(0, 3),
      sourceSignals: r.sources,
      score: r.score - penalty,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}

function currentMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export interface Opportunity {
  type: ReadinessType;
  label: string;
  startMin: number;
  endMin: number;
  level: ReadinessLevel;
}

/** "Today's strongest opportunity" for the home screen. */
export function strongestOpportunity(events: SlotEvent[], ctx: DayContext): Opportunity | null {
  const types: ReadinessType[] = ['FOCUS', 'DECISION', 'COMMUNICATION', 'CREATIVE'];
  let best: { type: ReadinessType; r: Readiness } | null = null;
  for (const type of types) {
    const r = dayReadiness(ctx.todayISO, type, ctx);
    if (r.score === null) continue;
    if (!best || r.score > (best.r.score as number)) best = { type, r };
  }
  if (!best || best.r.level === 'PROTECT') return null;

  const blocks = freeBlocks(events, ctx.todayISO, Math.max(WORK_START, currentMinutes())).filter(([s, e]) => e - s >= 45);
  if (blocks.length === 0) return null;
  const block = blocks.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
  const end = Math.min(block[1], block[0] + DEFAULT_DURATION[best.type]);
  return {
    type: best.type,
    label: READINESS_TYPE_LABEL[best.type],
    startMin: block[0],
    endMin: end,
    level: best.r.level,
  };
}

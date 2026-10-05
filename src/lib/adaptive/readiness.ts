import type { DailyLog } from '@/types/models';
import { daysBetween, fromISODate } from '@/lib/dates';
import { SYMPTOMS } from './types';
import type {
  AdaptiveMode,
  Confidence,
  Readiness,
  ReadinessLevel,
  ReadinessType,
} from './types';
import type { PhaseReliability } from './mode';

/**
 * Readiness = "how well set up am I right now for this kind of work?" built
 * from what she actually reports. It is a productivity recommendation, never a
 * medical score, and it never invents data: with too little to go on it says so.
 */

type SignalKey = 'energy' | 'focus' | 'confidence' | 'sleep' | 'mood' | 'stress';
type Signals = Partial<Record<SignalKey, number>>; // each 0..1, higher = better

const MOOD_VALUE: Record<string, number> = { rough: 0, low: 0.25, ok: 0.5, good: 0.75, great: 1 };

const norm5 = (v: number) => Math.min(1, Math.max(0, (v - 1) / 4));

/** The five inputs that count as "data"; stress and symptoms only refine it. */
const CORE_KEYS: SignalKey[] = ['energy', 'focus', 'confidence', 'sleep', 'mood'];

export function signalsOf(log: DailyLog | undefined | null): Signals {
  if (!log) return {};
  const s: Signals = {};
  if (typeof log.energy === 'number' && log.energy >= 1) s.energy = norm5(log.energy);
  if (typeof log.focus === 'number') s.focus = norm5(log.focus);
  if (typeof log.decisionConfidence === 'number') s.confidence = norm5(log.decisionConfidence);
  if (typeof log.sleepQuality === 'number') s.sleep = norm5(log.sleepQuality);
  if (log.mood in MOOD_VALUE) s.mood = MOOD_VALUE[log.mood];
  if (typeof log.stress === 'number') s.stress = 1 - norm5(log.stress);
  return s;
}

export function coreSignalCount(log: DailyLog | undefined | null): number {
  const s = signalsOf(log);
  return CORE_KEYS.filter((k) => s[k] !== undefined).length;
}

const WEIGHTS: Record<ReadinessType | 'OVERALL', Signals> = {
  DECISION: { confidence: 0.3, focus: 0.22, sleep: 0.2, energy: 0.2, stress: 0.08 },
  FOCUS: { focus: 0.4, energy: 0.28, sleep: 0.2, stress: 0.12 },
  CREATIVE: { focus: 0.28, energy: 0.27, mood: 0.3, sleep: 0.15 },
  COMMUNICATION: { energy: 0.3, confidence: 0.25, focus: 0.2, mood: 0.15, sleep: 0.1 },
  SOCIAL: { energy: 0.45, mood: 0.4, sleep: 0.15 },
  RECOVERY: { energy: 0.3, sleep: 0.25, focus: 0.15, mood: 0.15, confidence: 0.1, stress: 0.05 },
  OVERALL: { energy: 0.3, sleep: 0.25, focus: 0.15, mood: 0.15, confidence: 0.1, stress: 0.05 },
};

function composite(signals: Signals, type: ReadinessType | 'OVERALL'): number | null {
  const w = WEIGHTS[type];
  let sum = 0;
  let wsum = 0;
  (Object.keys(w) as SignalKey[]).forEach((k) => {
    const v = signals[k];
    if (v !== undefined) {
      sum += (w[k] as number) * v;
      wsum += w[k] as number;
    }
  });
  return wsum > 0 ? sum / wsum : null;
}

/** A symptom is something she reports; it lowers readiness a little, nothing more is implied. */
export function symptomPenalty(log: DailyLog | undefined | null): number {
  const ids = log?.symptoms ?? [];
  let p = 0;
  for (const id of ids) {
    const flagged = SYMPTOMS.find((s) => s.id === id)?.flag;
    p += flagged ? 0.08 : 0.05;
  }
  return Math.min(0.25, p);
}

/** Day-level score for one log under a task type, or null when it has no usable data. */
export function scoreOfLog(log: DailyLog, type: ReadinessType | 'OVERALL'): number | null {
  const c = composite(signalsOf(log), type);
  if (c === null) return null;
  return Math.min(1, Math.max(0, c - symptomPenalty(log)));
}

export function levelFromScore(score: number): ReadinessLevel {
  if (score >= 0.78) return 'STRONG';
  if (score >= 0.62) return 'GOOD';
  if (score >= 0.45) return 'NEUTRAL';
  return 'PROTECT';
}

const PRIOR_SCORE = { HIGH: 0.78, MEDIUM: 0.58, LOW: 0.38 } as const;
export type PhasePrior = keyof typeof PRIOR_SCORE;

const POSITIVE: Record<SignalKey, string> = {
  energy: 'Your energy is high',
  focus: 'Your focus is sharp',
  confidence: 'Your decision confidence is high',
  sleep: 'You slept well',
  mood: 'Your mood is good',
  stress: 'Your stress is low',
};
const NEGATIVE: Record<SignalKey, string> = {
  energy: 'Your energy is low',
  focus: 'Your focus is low',
  confidence: 'Your decision confidence is low',
  sleep: 'Sleep was poor',
  mood: 'Your mood is low',
  stress: 'Your stress is high',
};

function explain(signals: Signals, type: ReadinessType | 'OVERALL', log: DailyLog | undefined): string[] {
  const w = WEIGHTS[type];
  const ranked = (Object.keys(signals) as SignalKey[])
    .filter((k) => w[k] !== undefined)
    .map((k) => ({ k, v: signals[k] as number, weight: w[k] as number }))
    .filter((x) => x.v >= 0.7 || x.v <= 0.35)
    .sort((a, b) => Math.abs(b.v - 0.5) * b.weight - Math.abs(a.v - 0.5) * a.weight)
    .slice(0, 3)
    .map((x) => (x.v >= 0.7 ? POSITIVE[x.k] : NEGATIVE[x.k]));
  const n = log?.symptoms?.length ?? 0;
  if (n > 0 && ranked.length < 3) ranked.push(`${n} symptom${n > 1 ? 's' : ''} reported`);
  return ranked;
}

export interface EvaluateInput {
  log: DailyLog | undefined | null;
  type: ReadinessType;
  mode: AdaptiveMode;
  /** Cycle-phase capacity, only used when the cycle is a reliable input. */
  phasePrior?: PhasePrior | null;
  phaseReliability?: PhaseReliability;
  /** Past logs (excluding today) — used to personalise and to set confidence. */
  history?: DailyLog[];
}

/** Non-regular modes need real inputs today: energy plus at least two more. */
const MIN_SIGNALS_ADAPTIVE = 3;

export function evaluateReadiness(input: EvaluateInput): Readiness {
  const { log, type, mode, phasePrior = null, phaseReliability = 'none', history = [] } = input;
  const signals = signalsOf(log);
  const core = coreSignalCount(log);
  const regular = mode === 'regular';
  const priorWeight = regular ? (phaseReliability === 'reliable' ? 0.25 : phaseReliability === 'partial' ? 0.1 : 0) : 0;

  if (core === 0) {
    if (regular && phasePrior && priorWeight > 0) {
      const score = Math.min(0.7, PRIOR_SCORE[phasePrior]);
      return {
        level: levelFromScore(score),
        score,
        confidence: 'low',
        reasons: ['Based on your cycle pattern — log today to sharpen this'],
        sources: ['cycle_phase'],
      };
    }
    return insufficient('Log how you feel today (energy, sleep, focus) and we will work from that.');
  }

  if (!regular && (core < MIN_SIGNALS_ADAPTIVE || signals.energy === undefined)) {
    return insufficient('We are still learning your pattern. Add energy, sleep and focus today and we will structure your day from that.');
  }

  let score = composite(signals, type) as number;
  score = Math.min(1, Math.max(0, score - symptomPenalty(log)));
  const sources = CORE_KEYS.filter((k) => signals[k] !== undefined).map((k) => k as string);
  if ((log?.symptoms?.length ?? 0) > 0) sources.push('symptoms');

  if (priorWeight > 0 && phasePrior) {
    score = (1 - priorWeight) * score + priorWeight * PRIOR_SCORE[phasePrior];
    sources.push('cycle_phase');
  }

  // Personal baseline: once there is a month of her own data, "good for her"
  // counts for more than an absolute scale.
  const past = history.map((h) => scoreOfLog(h, 'OVERALL')).filter((v): v is number => v !== null);
  if (past.length >= 21) {
    const mean = past.reduce((a, b) => a + b, 0) / past.length;
    const personal = Math.min(1, Math.max(0, 0.55 + (score - mean) * 1.2));
    score = 0.7 * score + 0.3 * personal;
    sources.push('personal_history');
  }

  let confidence: Confidence = core >= 4 || (regular && priorWeight > 0) ? 'medium' : 'low';
  if (past.length >= 30 && confidence === 'medium') confidence = 'high';
  if (past.length >= 14 && confidence === 'low') confidence = 'medium';

  let level = levelFromScore(score);
  if (level === 'STRONG' && confidence === 'low') level = 'GOOD';

  return { level, score, confidence, reasons: explain(signals, type, log ?? undefined), sources };
}

function insufficient(reason: string): Readiness {
  return { level: 'INSUFFICIENT_DATA', score: null, confidence: 'low', reasons: [reason], sources: [] };
}

// ── Looking ahead ───────────────────────────────────────────────────────────

const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

export interface PredictInput {
  dateISO: string;
  type: ReadinessType;
  history: DailyLog[];
  todayISO: string;
}

/**
 * Expected readiness for a day she hasn't lived yet, from her own recent
 * check-ins and her weekday pattern — never from a cycle-day guess. Needs a
 * couple of weeks of real data, otherwise it returns INSUFFICIENT_DATA.
 */
export function predictReadiness(input: PredictInput): Readiness {
  const { dateISO, type, history, todayISO } = input;
  const usable = history
    .filter((l) => coreSignalCount(l) >= MIN_SIGNALS_ADAPTIVE)
    .map((l) => ({ l, age: daysBetween(fromISODate(l.dateISO), fromISODate(todayISO)) }))
    .filter((x) => x.age >= 0 && x.age <= 90);

  const recent = usable.filter((x) => x.age <= 28);
  if (recent.length < 7) {
    return insufficient('Not enough check-ins yet to look ahead — keep logging and this fills in.');
  }

  let wsum = 0;
  let sum = 0;
  for (const { l, age } of recent) {
    const s = scoreOfLog(l, type);
    if (s === null) continue;
    const w = Math.pow(0.5, age / 7);
    sum += s * w;
    wsum += w;
  }
  if (wsum === 0) return insufficient('Not enough check-ins yet to look ahead.');
  const recentMean = sum / wsum;

  const weekday = fromISODate(dateISO).getDay();
  const sameDay = usable
    .filter((x) => fromISODate(x.l.dateISO).getDay() === weekday)
    .map((x) => scoreOfLog(x.l, type))
    .filter((v): v is number => v !== null);

  const reasons = [`Based on your last ${recent.length} check-ins`];
  let score = recentMean;
  const sources = ['recent_checkins'];
  if (sameDay.length >= 3) {
    const wmean = sameDay.reduce((a, b) => a + b, 0) / sameDay.length;
    score = 0.65 * recentMean + 0.35 * wmean;
    sources.push('weekday_pattern');
    if (wmean - recentMean > 0.08) reasons.push(`Your logged data shows ${DAY_NAMES[weekday]} tend to run higher`);
    else if (recentMean - wmean > 0.08) reasons.push(`Your logged data shows ${DAY_NAMES[weekday]} tend to run lower`);
  }

  const confidence: Confidence = recent.length >= 21 ? 'high' : recent.length >= 12 ? 'medium' : 'low';
  let level = levelFromScore(score);
  if (level === 'STRONG' && confidence === 'low') level = 'GOOD';
  return { level, score, confidence, reasons, sources };
}

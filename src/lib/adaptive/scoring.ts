import type { Prediction, PhaseKey } from '@/types/models';
import { CAPACITY_TO_PHASE_KEY, type CapacityPhase } from '@/lib/intelligence/capacity';
import { greenDates, scoreForDate, type ScoreColor } from '@/lib/intelligence/taskScore';
import { PHASE_APPROACH } from '@/lib/wellness/taskGuidance';
import { addDaysISO } from '@/lib/dates';
import { LEVEL_LABEL, type AdaptiveMode, type ReadinessLevel } from './types';
import { dayReadiness, readinessTypeFor, type DayContext } from './windows';

/**
 * One scoring facade for every screen. Regular users get exactly what they
 * had before (cycle phase × task type). Everyone else is scored from their own
 * check-ins — and a day with no basis for a score gets none, rather than a guess.
 */

export interface DayScore {
  /** Cycle phase — regular mode only. */
  phase: CapacityPhase | null;
  score: ScoreColor | null;
  /** Readiness level — adaptive modes only. */
  level: ReadinessLevel | null;
  /** Which row of the PREPARE / PERFORM / RECOVER table applies. */
  guidancePhase: PhaseKey | null;
  /** Shown as the phase name (regular) or as the readiness label (adaptive). */
  phaseLabel: string;
  phaseRowLabel: string;
  approach: string;
  /** Plain-language explanation for adaptive modes. */
  note?: string;
  reasons: string[];
}

const PHASE_LABELS: Record<CapacityPhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal_early: 'early Luteal',
  luteal_late: 'late Luteal',
};

const ADAPTIVE_GUIDANCE: Record<ReadinessLevel, { key: PhaseKey; approach: string }> = {
  PROTECT: { key: 'menstrual', approach: 'Protect & simplify' },
  NEUTRAL: { key: 'luteal', approach: 'Structure & close' },
  GOOD: { key: 'follicular', approach: 'Steady & explore' },
  STRONG: { key: 'ovulation', approach: 'Lead & connect' },
  INSUFFICIENT_DATA: { key: 'luteal', approach: 'Structure & close' },
};

function colorFor(level: ReadinessLevel): ScoreColor | null {
  if (level === 'STRONG' || level === 'GOOD') return 'green';
  if (level === 'NEUTRAL') return 'amber';
  if (level === 'PROTECT') return 'red';
  return null;
}

function noteFor(level: ReadinessLevel, reasons: string[]): string {
  const why = reasons.length ? ` ${reasons.slice(0, 2).join('; ')}.` : '';
  switch (level) {
    case 'STRONG':
      return `A strong window for this, based on your own check-ins.${why}`;
    case 'GOOD':
      return `A good window for this.${why}`;
    case 'NEUTRAL':
      return `Workable, though not your strongest time.${why}`;
    case 'PROTECT':
      return `This may ask more of you than your recent state supports — flex it if you can.${why}`;
    default:
      return "We're still learning your pattern, so there's no recommendation for this day yet.";
  }
}

export interface Scorer {
  mode: AdaptiveMode;
  scoreFor: (categoryId: string, dateISO: string, title?: string) => DayScore;
  /** Better dates for this kind of task, best first. */
  betterDates: (categoryId: string, count: number, opts?: { title?: string; excludeDateISO?: string }) => string[];
}

export function createScorer(args: {
  mode: AdaptiveMode;
  prediction: Prediction | null;
  ctx: DayContext;
}): Scorer {
  const { mode, prediction, ctx } = args;

  // Regular users: unchanged cycle-phase scoring.
  if (mode === 'regular' && prediction) {
    return {
      mode,
      scoreFor: (categoryId, dateISO) => {
        const r = scoreForDate(categoryId, dateISO, prediction);
        return {
          phase: r.phase,
          score: r.score,
          level: null,
          guidancePhase: CAPACITY_TO_PHASE_KEY[r.phase],
          phaseLabel: PHASE_LABELS[r.phase],
          phaseRowLabel: 'Current phase',
          approach: PHASE_APPROACH[CAPACITY_TO_PHASE_KEY[r.phase]],
          reasons: [],
        };
      },
      betterDates: (categoryId, count) => greenDates(categoryId, prediction, 30).slice(0, count),
    };
  }

  const scoreFor: Scorer['scoreFor'] = (categoryId, dateISO, title) => {
    const type = readinessTypeFor(categoryId, title);
    if (!type) {
      // Private events are never scored.
      return {
        phase: null, score: null, level: null, guidancePhase: 'luteal',
        phaseLabel: 'Private', phaseRowLabel: 'Your readiness', approach: ADAPTIVE_GUIDANCE.NEUTRAL.approach, reasons: [],
      };
    }
    const r = dayReadiness(dateISO, type, ctx);
    const g = ADAPTIVE_GUIDANCE[r.level];
    return {
      phase: null,
      score: colorFor(r.level),
      level: r.level,
      guidancePhase: g.key,
      phaseLabel: LEVEL_LABEL[r.level],
      phaseRowLabel: 'Your readiness',
      approach: g.approach,
      note: noteFor(r.level, r.reasons),
      reasons: r.reasons,
    };
  };

  return {
    mode,
    scoreFor,
    betterDates: (categoryId, count, opts) => {
      const type = readinessTypeFor(categoryId, opts?.title);
      if (!type) return [];
      // "Better" means better than the day she is looking at, drawn from her own pattern.
      const current = opts?.excludeDateISO ? dayReadiness(opts.excludeDateISO, type, ctx).score : null;
      const candidates: { d: string; score: number }[] = [];
      for (let i = 1; i <= 14; i++) {
        const d = addDaysISO(ctx.todayISO, i);
        if (d === opts?.excludeDateISO) continue;
        const dow = new Date(`${d}T12:00:00`).getDay();
        if (dow === 0 || dow === 6) continue;
        const r = dayReadiness(d, type, ctx);
        if (r.score === null || r.level === 'PROTECT' || r.level === 'INSUFFICIENT_DATA') continue;
        if (current !== null && r.score < current + 0.03) continue;
        candidates.push({ d, score: r.score });
      }
      return candidates.sort((x, y) => y.score - x.score).slice(0, count).map((c) => c.d);
    },
  };
}

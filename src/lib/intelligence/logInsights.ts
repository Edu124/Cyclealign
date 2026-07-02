import type { DailyLog, Prediction } from '@/types/models';
import { MOODS_QUICK } from '@/lib/stores/useDailyLog';
import { addDaysISO, todayISO } from '@/lib/dates';
import { phaseForDate } from './taskScore';
import { CAPACITY_PHASE_LABEL, CapacityPhase } from './capacity';

/**
 * Personalization from Quick Logs (V1). Compares the energy the user actually
 * logged against the textbook expectation for each capacity phase, and speaks
 * up once there's enough signal. Pure on-device math — no AI call needed.
 */

/** Textbook energy expectation (1–5 scale) per capacity phase. */
const EXPECTED_ENERGY: Record<CapacityPhase, number> = {
  menstrual: 2,
  follicular: 4,
  ovulatory: 4.5,
  luteal_early: 3.5,
  luteal_late: 2.5,
};

/** Minimum check-ins in one phase bucket before we trust the pattern. */
const MIN_LOGS = 3;
/** How far (1–5 scale) the logged average must drift from textbook to matter. */
const MIN_GAP = 1.2;

export interface LogInsight {
  phase: CapacityPhase;
  direction: 'lower' | 'higher';
  avgLogged: number;
  count: number;
  message: string;
}

/**
 * Detect the strongest expectation-vs-reality gap across phases.
 * Returns null until there's enough data — no premature conclusions.
 */
export function analyzeLogs(
  logs: Record<string, DailyLog>,
  prediction: Prediction,
): LogInsight | null {
  const buckets: Partial<Record<CapacityPhase, number[]>> = {};

  for (const log of Object.values(logs)) {
    if (!log.energy) continue;
    const phase = phaseForDate(log.dateISO, prediction);
    (buckets[phase] ??= []).push(log.energy);
  }

  let best: LogInsight | null = null;
  for (const [phase, energies] of Object.entries(buckets) as [CapacityPhase, number[]][]) {
    if (energies.length < MIN_LOGS) continue;
    const avg = energies.reduce((a, b) => a + b, 0) / energies.length;
    const gap = avg - EXPECTED_ENERGY[phase];
    if (Math.abs(gap) < MIN_GAP) continue;
    if (best && Math.abs(gap) <= Math.abs(best.avgLogged - EXPECTED_ENERGY[best.phase])) continue;

    const direction = gap < 0 ? 'lower' : 'higher';
    const label = CAPACITY_PHASE_LABEL[phase];
    const rounded = Math.round(avg * 10) / 10;
    best = {
      phase,
      direction,
      avgLogged: rounded,
      count: energies.length,
      message:
        direction === 'lower'
          ? `Across ${energies.length} check-ins, your energy in ${label} averages ${rounded}/5 — lower than typical. Consider planning a lighter load in that window; your predictions here will lean gentler.`
          : `Across ${energies.length} check-ins, your energy in ${label} averages ${rounded}/5 — higher than typical. You may handle more in this window than standard advice suggests.`,
    };
  }
  return best;
}

/**
 * Compact plain-text summary of the last `days` of check-ins, for the AI
 * coach's context. Empty string when there's nothing logged.
 */
export function recentLogSummary(
  logs: Record<string, DailyLog>,
  days = 7,
): string {
  const today = todayISO();
  const lines: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDaysISO(today, -i);
    const log = logs[d];
    if (!log) continue;
    const mood = MOODS_QUICK.find((m) => m.key === log.mood)?.label ?? log.mood;
    lines.push(`${i === 0 ? 'today' : `${i}d ago`}: energy ${log.energy}/5, mood ${mood}`);
  }
  return lines.join('; ').slice(0, 400);
}

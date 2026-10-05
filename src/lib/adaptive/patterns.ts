import type { DailyLog } from '@/types/models';
import { daysBetween, fromISODate } from '@/lib/dates';
import { SYMPTOMS } from './types';
import type { Confidence } from './types';
import { coreSignalCount } from './readiness';

/**
 * Personal pattern learning. Everything here is phrased as what SHE reports
 * ("You tend to report…", "Your logged data shows…") — never as a cause, and
 * never attributed to hormones.
 */

export type PatternStage = 'none' | 'basic' | 'emerging' | 'strong';

export interface PatternInsight {
  id: string;
  text: string;
  confidence: Confidence;
  /** Days of history the observation draws on: 30 / 60 / 90. */
  evidenceWindow: 30 | 60 | 90;
}

export interface PatternSummary {
  stage: PatternStage;
  daysLogged: number;
  insights: PatternInsight[];
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const one = (n: number) => (Math.round(n * 10) / 10).toString();

function within(logs: DailyLog[], todayISO: string, days: number): DailyLog[] {
  return logs.filter((l) => {
    const age = daysBetween(fromISODate(l.dateISO), fromISODate(todayISO));
    return age >= 0 && age < days;
  });
}

export function derivePatterns(allLogs: DailyLog[], todayISO: string): PatternSummary {
  const detailed = allLogs.filter((l) => coreSignalCount(l) >= 3);
  const w30 = within(detailed, todayISO, 30);
  const w60 = within(detailed, todayISO, 60);
  const w90 = within(detailed, todayISO, 90);

  const stage: PatternStage =
    w90.length >= 45 ? 'strong' : w60.length >= 25 ? 'emerging' : w30.length >= 10 ? 'basic' : 'none';
  if (stage === 'none') return { stage, daysLogged: detailed.length, insights: [] };

  const window: 30 | 60 | 90 = stage === 'strong' ? 90 : stage === 'emerging' ? 60 : 30;
  const logs = stage === 'strong' ? w90 : stage === 'emerging' ? w60 : w30;
  const confidence: Confidence = stage === 'strong' ? 'high' : stage === 'emerging' ? 'medium' : 'low';
  const insights: PatternInsight[] = [];
  const push = (id: string, text: string) => insights.push({ id, text, confidence, evidenceWindow: window });

  // Best decision conditions
  const sure = logs.filter((l) => (l.decisionConfidence ?? 0) >= 4);
  if (sure.length >= 5) {
    const sleeps = sure.map((l) => l.sleepQuality).filter((v): v is number => v !== undefined);
    const energies = sure.map((l) => l.energy);
    if (sleeps.length >= 5) {
      push(
        'best_decision',
        `On days you report strong decision confidence, you tend to report sleep around ${one(avg(sleeps))}/5 and energy around ${one(avg(energies))}/5.`,
      );
    }
  }

  // Sleep and focus
  const good = logs.filter((l) => (l.sleepQuality ?? 0) >= 4 && l.focus !== undefined);
  const poor = logs.filter((l) => l.sleepQuality !== undefined && l.sleepQuality <= 2 && l.focus !== undefined);
  if (good.length >= 5 && poor.length >= 4) {
    const g = avg(good.map((l) => l.focus as number));
    const p = avg(poor.map((l) => l.focus as number));
    if (g - p >= 0.8) {
      push('sleep_focus', `You tend to report higher focus after good sleep (${one(g)} vs ${one(p)} out of 5).`);
    }
  }

  // Best deep-work conditions
  const sharp = logs.filter((l) => (l.focus ?? 0) >= 4);
  if (sharp.length >= 5) {
    const e = avg(sharp.map((l) => l.energy));
    push('best_focus', `Your logged data shows your sharpest focus days usually come with energy around ${one(e)}/5.`);
  }

  // Low-capacity conditions
  const low = logs.filter((l) => l.energy <= 2);
  if (low.length >= 5) {
    const lowSleep = low.filter((l) => l.sleepQuality !== undefined && l.sleepQuality <= 2).length;
    const withSleep = low.filter((l) => l.sleepQuality !== undefined).length;
    if (withSleep >= 5 && lowSleep / withSleep >= 0.6) {
      push('low_capacity', 'Your lower-energy days often follow nights you rated poorly for sleep.');
    }
  }

  // Symptoms and energy
  const counts: Record<string, number> = {};
  logs.forEach((l) => (l.symptoms ?? []).forEach((s) => (counts[s] = (counts[s] ?? 0) + 1)));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 5) {
    const withS = logs.filter((l) => l.symptoms?.includes(top[0]));
    const without = logs.filter((l) => !l.symptoms?.includes(top[0]));
    if (without.length >= 5) {
      const d = avg(without.map((l) => l.energy)) - avg(withS.map((l) => l.energy));
      const label = SYMPTOMS.find((s) => s.id === top[0])?.label.toLowerCase() ?? top[0];
      if (d >= 0.8) {
        push('symptom_energy', `You tend to report lower energy on days you log ${label} (about ${one(d)} points lower).`);
      }
    }
  }

  return { stage, daysLogged: detailed.length, insights };
}

export const STAGE_COPY: Record<PatternStage, string> = {
  none: 'Keep logging — after about a month of check-ins we can start spotting your own patterns.',
  basic: 'Early observations from the last 30 days.',
  emerging: 'Patterns are emerging across 60 days of your check-ins.',
  strong: 'A stronger picture, built from 90 days of your own data.',
};

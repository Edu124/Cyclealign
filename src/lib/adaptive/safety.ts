import type { DailyLog } from '@/types/models';
import { daysBetween, fromISODate } from '@/lib/dates';
import { SYMPTOMS } from './types';

export const CLINICIAN_MESSAGE =
  'Some symptoms or bleeding patterns should be discussed with a healthcare professional. CycleAlign can help you keep a record to take to your clinician.';

export const CLINICIAN_CTA = 'Track & Discuss With Your Doctor';

export const REPORT_DISCLAIMER =
  'This report summarizes information entered by the user. It is not a medical diagnosis.';

/**
 * A neutral nudge — never a diagnosis. Triggers when something worth a
 * clinician's eyes keeps being reported: flagged symptoms or heavy bleeding on
 * three or more of the last 14 days.
 */
export function needsClinicianPrompt(logs: DailyLog[], todayISO: string): boolean {
  const flagged = new Set(SYMPTOMS.filter((s) => s.flag).map((s) => s.id));
  let days = 0;
  for (const l of logs) {
    const age = daysBetween(fromISODate(l.dateISO), fromISODate(todayISO));
    if (age < 0 || age >= 14) continue;
    const hit = l.bleeding === 'heavy' || (l.symptoms ?? []).some((s) => flagged.has(s));
    if (hit) days++;
  }
  return days >= 3;
}

/** Plain-text summary she can share with a clinician. Only what she entered. */
export function buildClinicianReport(logs: DailyLog[], todayISO: string, days = 90): string {
  const recent = logs
    .filter((l) => {
      const age = daysBetween(fromISODate(l.dateISO), fromISODate(todayISO));
      return age >= 0 && age < days;
    })
    .sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));

  const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '—');
  const nums = (pick: (l: DailyLog) => number | undefined) =>
    recent.map(pick).filter((v): v is number => typeof v === 'number');

  const symptomCounts: Record<string, number> = {};
  recent.forEach((l) => (l.symptoms ?? []).forEach((s) => (symptomCounts[s] = (symptomCounts[s] ?? 0) + 1)));
  const symptomLines = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => `  - ${SYMPTOMS.find((s) => s.id === id)?.label ?? id}: ${n} day${n > 1 ? 's' : ''}`);

  const bleedingDays = recent.filter((l) => l.bleeding && l.bleeding !== 'none');
  const lines = [
    'CycleAlign — health pattern summary',
    `Period covered: last ${days} days (${recent.length} days with a check-in)`,
    '',
    `Average energy: ${avg(nums((l) => l.energy))}/5`,
    `Average sleep quality: ${avg(nums((l) => l.sleepQuality))}/5`,
    `Average focus: ${avg(nums((l) => l.focus))}/5`,
    `Average stress: ${avg(nums((l) => l.stress))}/5`,
    '',
    `Days with bleeding logged: ${bleedingDays.length}`,
    ...bleedingDays.slice(-14).map((l) => `  - ${l.dateISO}: ${l.bleeding}`),
    '',
    'Symptoms she reported:',
    ...(symptomLines.length ? symptomLines : ['  - none logged']),
    '',
    'Questions for my clinician:',
    '  -',
    '',
    REPORT_DISCLAIMER,
  ];
  return lines.join('\n');
}

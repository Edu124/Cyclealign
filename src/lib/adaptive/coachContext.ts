import type { Task } from '@/lib/stores/useTasks';
import { categoryById } from '@/lib/intelligence/taskScore';
import { addDaysISO, fromISODate } from '@/lib/dates';
import { LEVEL_LABEL } from './types';
import type { useAdaptive } from './useAdaptive';

type Adaptive = ReturnType<typeof useAdaptive>;

/** The leadership-first prompts CycleAlign leads with. */
export const COACH_STARTERS = [
  'When should I schedule this important meeting?',
  'How should I plan today?',
  'Show me my strongest decision windows this week.',
  'What patterns have you noticed in my productivity?',
];

/**
 * What the companion is told about HER state. Built from her check-ins only —
 * calendar event titles and times are never included (our privacy policy says
 * the AI never receives calendar data).
 */
export function coachStateSummary(a: Adaptive): string | undefined {
  const log = a.todayLog;
  const decision = a.readinessFor('DECISION');
  const focus = a.readinessFor('FOCUS');
  const parts: string[] = [];
  if (log) {
    parts.push(`energy ${log.energy}/5`);
    if (log.sleepQuality !== undefined) parts.push(`sleep ${log.sleepQuality}/5`);
    if (log.focus !== undefined) parts.push(`focus ${log.focus}/5`);
    if (log.decisionConfidence !== undefined) parts.push(`decision confidence ${log.decisionConfidence}/5`);
    if (log.stress !== undefined) parts.push(`stress ${log.stress}/5`);
    if (log.symptoms?.length) parts.push(`reported ${log.symptoms.length} symptom(s)`);
  }
  if (!log && decision.level === 'INSUFFICIENT_DATA') return 'No check-in today yet and not enough history to say how she is doing.';
  const readiness = `Decision readiness ${LEVEL_LABEL[decision.level]}; focus readiness ${LEVEL_LABEL[focus.level]}.`;
  return `${parts.length ? `Today she reports ${parts.join(', ')}. ` : ''}${readiness}`;
}

/** Her strongest upcoming days for decisions, from check-in patterns alone. */
export function coachWeekOutlook(a: Adaptive): string | undefined {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDaysISO(a.todayISO, i);
    const dow = fromISODate(d).getDay();
    if (dow === 0 || dow === 6) continue;
    const r = a.readinessFor('DECISION', d);
    if (r.level === 'STRONG' || r.level === 'GOOD') {
      days.push(`${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]} (${LEVEL_LABEL[r.level]})`);
    }
  }
  return days.length ? `Strongest days for decisions this week, from her own pattern: ${days.join(', ')}.` : undefined;
}

/** Task categories planned in the app — never task labels. */
export function coachTasksSummary(tasks: Task[]): string | undefined {
  const today = tasks.filter((t) => !t.done).slice(0, 8);
  if (today.length === 0) return undefined;
  const counts: Record<string, number> = {};
  today.forEach((t) => {
    const label = categoryById(t.category)?.label ?? 'Other';
    counts[label] = (counts[label] ?? 0) + 1;
  });
  return Object.entries(counts).map(([k, n]) => `${n} × ${k}`).join(', ');
}

import { dayReadiness, readinessTypeFor } from './windows';
import type { DayContext, DecisionWindow, SlotEvent } from './windows';
import type { ReadinessLevel, ReadinessType } from './types';

export type PlanAdvice = 'protect' | 'keep' | 'keep_buffer' | 'flex' | 'move' | 'protect_flex' | 'learn' | 'private';

export interface DayPlanItem {
  event: SlotEvent;
  type: ReadinessType | null;
  level: ReadinessLevel | null;
  advice: PlanAdvice;
  headline: string;
  reasons: string[];
  /** A stronger slot she can accept, move to, or ignore. */
  window?: DecisionWindow;
}

export type RankFn = (
  categoryId: string,
  title: string | undefined,
  opts: { excludeDateISO: string; days: number; durationMin?: number },
) => DecisionWindow[];

/**
 * "Optimize My Day": for each thing on today's list, keep it, protect it, or
 * offer a stronger slot. Only ever a suggestion — nothing moves until she
 * confirms it.
 */
export function buildDayPlan(
  events: SlotEvent[],
  ctx: DayContext,
  rank: RankFn,
  isIgnored: (event: SlotEvent, w: DecisionWindow) => boolean,
): DayPlanItem[] {
  const items = events
    .filter((e) => e.dateISO === ctx.todayISO)
    .map<DayPlanItem>((event) => {
      const type = readinessTypeFor(event.categoryId, event.title);
      if (!type) {
        return { event, type, level: null, advice: 'private', headline: 'Private — left alone.', reasons: [] };
      }
      const r = dayReadiness(ctx.todayISO, type, ctx);
      const base = { event, type, level: r.level, reasons: r.reasons };

      if (r.level === 'INSUFFICIENT_DATA') {
        return { ...base, advice: 'learn', headline: "Add today's check-in and we'll advise on this." };
      }
      if (type === 'RECOVERY') {
        return { ...base, advice: 'flex', headline: 'Flexible — fits a low-capacity slot.' };
      }
      if (r.level === 'STRONG') {
        const protect = type === 'FOCUS' || type === 'CREATIVE';
        return {
          ...base,
          advice: protect ? 'protect' : 'keep',
          headline: protect ? 'Strong window — protect this time.' : 'Strong window — keep it.',
        };
      }
      if (r.level === 'GOOD') return { ...base, advice: 'keep', headline: 'Good window — keep it.' };
      if (r.level === 'NEUTRAL') {
        return { ...base, advice: 'keep_buffer', headline: 'Workable — leave a short buffer either side.' };
      }

      // PROTECT: today may ask more of her than her recent state supports.
      const durationMin =
        event.startMin !== undefined && event.endMin !== undefined ? event.endMin - event.startMin : undefined;
      const window = rank(event.categoryId, event.title, { excludeDateISO: ctx.todayISO, days: 10, durationMin }).find(
        (w) => !isIgnored(event, w),
      );
      return window
        ? { ...base, advice: 'move', headline: 'A stronger window is available.', window }
        : { ...base, advice: 'protect_flex', headline: 'Flex if you can — no stronger window found yet.' };
    });

  return items.sort((a, b) => (a.event.startMin ?? 24 * 60) - (b.event.startMin ?? 24 * 60));
}

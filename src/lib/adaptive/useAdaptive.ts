import { useMemo } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useCalendar, type CalendarEvent } from '@/lib/stores/useCalendar';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { CAPACITY } from '@/lib/intelligence/capacity';
import { phaseForDate } from '@/lib/intelligence/taskScore';
import { todayISO as getTodayISO } from '@/lib/dates';
import { phaseReliability, resolveMode } from './mode';
import { derivePatterns } from './patterns';
import { needsClinicianPrompt } from './safety';
import { createScorer } from './scoring';
import {
  dayReadiness,
  rankWindows,
  readinessTypeFor,
  strongestOpportunity,
  type DayContext,
  type SlotEvent,
} from './windows';
import type { ReadinessType } from './types';

/** Calendar events → events with minutes; falls back to the "9:30 AM" label for older/sample events. */
export function toSlotEvents(events: CalendarEvent[]): SlotEvent[] {
  return events.map((e) => {
    let { startMin, endMin } = e;
    if (startMin === undefined) {
      const m = /(\d{1,2}):(\d{2})\s?(AM|PM)?/i.exec(e.timeLabel ?? '');
      if (m) {
        let h = parseInt(m[1], 10);
        const mer = m[3]?.toUpperCase();
        if (mer === 'PM' && h < 12) h += 12;
        if (mer === 'AM' && h === 12) h = 0;
        startMin = h * 60 + parseInt(m[2], 10);
        endMin = startMin + 60;
      }
    }
    return { id: e.id, title: e.title, categoryId: e.categoryId, dateISO: e.dateISO, startMin, endMin };
  });
}

/** One place the UI asks "what mode is she in, and how ready is she?" */
export function useAdaptive() {
  const profile = useAppStore((s) => s.profile);
  const cycleLogs = useAppStore((s) => s.cycleLogs);
  const prediction = usePrediction();
  const logs = useDailyLog((s) => s.logs);
  const events = useCalendar((s) => s.events);
  const today = getTodayISO();

  return useMemo(() => {
    const mode = resolveMode(profile);
    const reliability = phaseReliability(profile, cycleLogs);
    const all = Object.values(logs);
    const ctx: DayContext = {
      mode,
      history: all,
      todayISO: today,
      todayLog: logs[today],
      phaseFor:
        mode === 'regular' && prediction && reliability !== 'none'
          ? (dateISO) => ({ prior: CAPACITY[phaseForDate(dateISO, prediction)], reliability })
          : undefined,
    };
    const slotEvents = toSlotEvents(events);

    return {
      mode,
      reliability,
      prediction,
      scorer: createScorer({ mode, prediction, ctx }),
      ctx,
      todayISO: today,
      todayLog: logs[today],
      slotEvents,
      readinessFor: (type: ReadinessType, dateISO = today) => dayReadiness(dateISO, type, ctx),
      rank: (categoryId: string, title?: string, opts?: { fromISO?: string; days?: number; excludeDateISO?: string; durationMin?: number }) =>
        rankWindows({
          categoryId,
          title,
          fromISO: opts?.fromISO ?? today,
          days: opts?.days ?? 10,
          excludeDateISO: opts?.excludeDateISO,
          durationMin: opts?.durationMin,
          events: slotEvents,
          ctx,
        }),
      typeFor: readinessTypeFor,
      opportunity: strongestOpportunity(slotEvents, ctx),
      patterns: derivePatterns(all, today),
      clinicianPrompt: needsClinicianPrompt(all, today),
      hasProfileAnswers: !!profile?.cycleRegularity || !!profile?.healthContext,
    };
  }, [profile, cycleLogs, prediction, logs, events, today]);
}

/** Scoring only — for components that just need "how does this task fare on this date". */
export function useScorer() {
  return useAdaptive().scorer;
}

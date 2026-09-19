import type { CalendarEvent } from '@/lib/stores/useCalendar';
import type { Prediction } from '@/types/models';
import { addDaysISO, todayISO } from '@/lib/dates';
import type { CapacityPhase } from './capacity';
import { phaseForDate } from './taskScore';

/**
 * One sample event per phase, placed on the first upcoming day that lands in
 * that phase for HER cycle (fixed day offsets can't guarantee that). Where the
 * score matrix has a red for the phase (menstrual, late luteal) the event uses
 * a red category; the other phases have no red category at all, so theirs are
 * the strongest amber ones.
 */
const PER_PHASE: { phase: CapacityPhase; categoryId: string; title: string; timeLabel: string }[] = [
  { phase: 'menstrual',    categoryId: 'HIGH_CONVO', title: 'Board presentation',     timeLabel: '10:00 AM' }, // red
  { phase: 'follicular',   categoryId: 'HIGH_CONVO', title: 'Client negotiation',     timeLabel: '11:30 AM' }, // amber
  { phase: 'ovulatory',    categoryId: 'DEEP_FOCUS', title: 'Strategy writing block', timeLabel: '2:00 PM'  }, // amber
  { phase: 'luteal_early', categoryId: 'DECISION',   title: 'Budget sign-off',        timeLabel: '9:30 AM'  }, // amber
  { phase: 'luteal_late',  categoryId: 'DECISION',   title: 'Hiring decision',        timeLabel: '3:00 PM'  }, // red
];

export function phaseTestEvents(prediction: Prediction): CalendarEvent[] {
  const start = todayISO();
  const events: CalendarEvent[] = [];
  for (const { phase, categoryId, title, timeLabel } of PER_PHASE) {
    for (let i = 0; i <= 60; i++) {
      const dateISO = addDaysISO(start, i);
      if (phaseForDate(dateISO, prediction) === phase) {
        events.push({
          id: `ev-phase-${phase}`,
          title,
          categoryId,
          dateISO,
          timeLabel,
          isPrivate: false,
        });
        break;
      }
    }
  }
  return events;
}

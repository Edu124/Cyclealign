import { PhaseInfo, PhaseKey } from '@/types/models';

export const PHASE_ORDER: PhaseKey[] = [
  'menstrual',
  'follicular',
  'ovulation',
  'luteal',
];

/**
 * Compute the four phase boundaries for a given cycle.
 *
 * The luteal phase is the most biologically stable (~14 days), so we anchor
 * ovulation at `cycleLength - 14` and derive the others from there. This keeps
 * predictions sensible for both short and long cycles.
 *
 * Day ranges are 1-based and inclusive.
 */
export function getPhases(
  cycleLength: number,
  periodLength: number,
): PhaseInfo[] {
  const clampedPeriod = Math.max(2, Math.min(periodLength, 10));
  // Ovulation day, 1-based. Guard so it never collides with the period.
  const ovulationDay = Math.max(clampedPeriod + 2, cycleLength - 14);
  // Treat ovulation as a short 3-day window centred on the ovulation day.
  const ovStart = Math.max(clampedPeriod + 1, ovulationDay - 1);
  const ovEnd = Math.min(cycleLength - 1, ovulationDay + 1);

  return [
    {
      key: 'menstrual',
      title: 'Menstrual',
      subtitle: 'Your period — rest and renew',
      range: [1, clampedPeriod],
    },
    {
      key: 'follicular',
      title: 'Follicular',
      subtitle: 'Energy rising — fresh starts',
      range: [clampedPeriod + 1, ovStart - 1],
    },
    {
      key: 'ovulation',
      title: 'Ovulation',
      subtitle: 'Peak fertility & confidence',
      range: [ovStart, ovEnd],
    },
    {
      key: 'luteal',
      title: 'Luteal',
      subtitle: 'Winding down — be gentle',
      range: [ovEnd + 1, cycleLength],
    },
  ];
}

/** Map a 1-based day-of-cycle to its phase for the given cycle. */
export function phaseForDay(
  dayOfCycle: number,
  cycleLength: number,
  periodLength: number,
): PhaseKey {
  const phases = getPhases(cycleLength, periodLength);
  for (const phase of phases) {
    const [from, to] = phase.range;
    if (dayOfCycle >= from && dayOfCycle <= to) return phase.key;
  }
  // Fallback for any rounding edge-cases at the very end of the cycle.
  return 'luteal';
}

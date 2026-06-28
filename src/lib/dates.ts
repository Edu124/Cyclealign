import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';

/** Format a Date as an ISO calendar date (yyyy-mm-dd), ignoring time/zone noise. */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Parse an ISO calendar date into a local Date at midnight. */
export function fromISODate(iso: string): Date {
  return startOfDay(parseISO(iso));
}

/** Whole calendar days from `a` to `b` (b - a). Positive when b is later. */
export function daysBetween(a: Date, b: Date): number {
  return differenceInCalendarDays(startOfDay(b), startOfDay(a));
}

export function addDaysISO(iso: string, days: number): string {
  return toISODate(addDays(fromISODate(iso), days));
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

/** Human label like "in 5 days", "Today", "Tomorrow", "2 days ago". */
export function relativeDays(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export { addDays, format, differenceInCalendarDays };

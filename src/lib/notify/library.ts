import type { PhaseKey } from '@/types/models';
import bundled from './library.json';

/**
 * The notification content library: every message CycleAlign can send, plus
 * the central schedule config (default time, quiet hours, daily cap…).
 *
 * The copy ships with the app (library.json) and can be replaced without a
 * release by publishing a row in `app_content` with key `notification_library`.
 * A message can be paused there by setting `"paused": true`.
 */

export type NotificationType = 'daily_guidance' | 'symptom_checkin' | 'period_confirmation';

/** What has to be true for a message to be picked. */
export type Trigger =
  | 'urgent'
  | 'no_data'
  | 'stale'
  | 'cramps'
  | 'low_mood'
  | 'cravings'
  | 'positive_mood'
  | 'mood_missing'
  | 'phase'
  | 'general'
  | 'reminder';

/** Where tapping a notification goes. Resolved to a real route in deepLinks.ts. */
export type LinkKey =
  | 'today'
  | 'comfort_tips'
  | 'mood_checkin'
  | 'daily_planner'
  | 'cycle_overview'
  | 'prep_tips'
  | 'snack_ideas'
  | 'cycle_setup'
  | 'nutrition'
  | 'nutrition_phase';

export interface NotificationMessage {
  id: string;
  version: number;
  type: NotificationType;
  trigger: Trigger;
  /** Phases the message may be used in. Absent = any (copy has no phase claim). */
  phases?: PhaseKey[];
  /** 'ok' = only with good cycle data (used for ovulation-window copy). */
  minConfidence?: 'low' | 'ok';
  /** Luteal "period may be approaching" copy only near the expected date. */
  maxDaysToPeriod?: number;
  topic: string;
  /** Days before the same message may be picked again (defaults to config.rotationDays). */
  cooldownDays?: number;
  title: string;
  body: string;
  /** Lock-screen title when the title itself would reveal cycle details. */
  lockTitle?: string;
  cta: string;
  link: LinkKey;
  paused?: boolean;
}

export interface NotificationConfig {
  defaultHour: number;
  defaultMinute: number;
  eveningHour: number;
  eveningMinute: number;
  quietStartHour: number;
  quietEndHour: number;
  dailyCap: number;
  rotationDays: number;
  planDays: number;
  staleAfterDaysPastDue: number;
  neutralLockBody: string;
}

export interface NotificationLibrary {
  version: number;
  config: NotificationConfig;
  messages: NotificationMessage[];
}

export const BUNDLED_LIBRARY = bundled as NotificationLibrary;

const LINKS: LinkKey[] = [
  'today', 'comfort_tips', 'mood_checkin', 'daily_planner', 'cycle_overview',
  'prep_tips', 'snack_ideas', 'cycle_setup', 'nutrition', 'nutrition_phase',
];
const TYPES: NotificationType[] = ['daily_guidance', 'symptom_checkin', 'period_confirmation'];

function isMessage(m: unknown): m is NotificationMessage {
  if (!m || typeof m !== 'object') return false;
  const x = m as Record<string, unknown>;
  return (
    typeof x.id === 'string' &&
    typeof x.version === 'number' &&
    TYPES.includes(x.type as NotificationType) &&
    typeof x.trigger === 'string' &&
    typeof x.title === 'string' && x.title.length > 0 &&
    typeof x.body === 'string' && x.body.length > 0 &&
    typeof x.cta === 'string' &&
    LINKS.includes(x.link as LinkKey)
  );
}

/**
 * Accepts a remote library only when it is well-formed. Missing config keys
 * fall back to the bundled defaults; malformed messages are dropped; a
 * library left with no usable general fallback is rejected outright.
 */
export function parseLibrary(raw: unknown): NotificationLibrary | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== 'number' || !Array.isArray(r.messages)) return null;
  const messages = r.messages.filter(isMessage);
  if (!messages.some((m) => m.trigger === 'general' && !m.paused)) return null;
  const cfg = (r.config && typeof r.config === 'object' ? r.config : {}) as Partial<NotificationConfig>;
  const config = { ...BUNDLED_LIBRARY.config };
  (Object.keys(config) as (keyof NotificationConfig)[]).forEach((k) => {
    if (typeof cfg[k] === typeof config[k]) (config as Record<string, unknown>)[k] = cfg[k];
  });
  return { version: r.version, config, messages };
}

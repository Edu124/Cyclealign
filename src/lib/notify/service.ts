import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { todayISO } from '@/lib/dates';
import { BUNDLED_LIBRARY, parseLibrary, type NotificationLibrary } from './library';
import { buildPlan, isQuietNow, type PlanInput, type PlannedItem, type SentRecord } from './decide';
import { isSentStatus, useNotificationLedger, type LedgerItem, type LoggedEvent } from '@/lib/stores/useNotificationLedger';
import { useNotificationPrefs } from '@/lib/stores/useNotificationPrefs';

/**
 * Side-effect half of the notification system: OS permission, scheduling
 * local pushes from the plan, the foreground handler, event logging and the
 * sign-out cleanup. All decisions come from decide.ts.
 */

export const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';
const ANDROID_CHANNEL = 'daily';
const ID_PREFIX = 'ca:';

// ── Content library (bundled, replaceable from app_content) ───────────────────

let library: NotificationLibrary = BUNDLED_LIBRARY;
let libraryFetchedAt = 0;

export async function getLibrary(): Promise<NotificationLibrary> {
  if (!isSupabaseConfigured || Date.now() - libraryFetchedAt < 6 * 3_600_000) return library;
  libraryFetchedAt = Date.now();
  try {
    const { data } = await supabase
      .from('app_content')
      .select('data')
      .eq('key', 'notification_library')
      .maybeSingle();
    const parsed = parseLibrary((data as { data?: unknown } | null)?.data);
    if (parsed) library = parsed;
  } catch {}
  return library;
}

export function currentLibrary(): NotificationLibrary {
  return library;
}

// ── Permission ────────────────────────────────────────────────────────────────

let handlerInstalled = false;

/**
 * Foreground behaviour. When the app is open and in-app pop-ups are on, our
 * own daily messages appear as the pop-up instead of a banner on top of it.
 */
export function installNotificationHandler() {
  if (handlerInstalled || !isSupported) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async (n) => {
      const data = (n.request.content.data ?? {}) as Record<string, unknown>;
      const ours = data.cyclealign === 1;
      const asPopup = ours && useNotificationPrefs.getState().inApp;
      return {
        shouldShowBanner: !asPopup,
        shouldShowList: !asPopup,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Daily guidance',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync('default', {
    name: 'CycleAlign',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function hasPushPermission(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Asks the OS only when she has chosen to turn notifications on. */
export async function requestPushPermission(): Promise<boolean> {
  if (!isSupported) return false;
  try {
    installNotificationHandler();
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

// ── Event logging ─────────────────────────────────────────────────────────────

export function eventFor(item: PlannedItem, status: LoggedEvent['status'], channel: 'push' | 'in_app', detail?: string): LoggedEvent {
  return {
    at: Date.now(),
    status,
    eventId: item.eventId,
    type: item.type,
    contentId: item.contentId,
    contentVersion: item.contentVersion,
    channel,
    phase: item.phase,
    confidence: item.confidence,
    detail,
  };
}

/**
 * Records events locally and, when signed in, in `notification_events` for
 * product analytics. Only ids, statuses and the phase category are sent —
 * never the message text or anything she logged.
 */
export function recordEvents(events: LoggedEvent[]) {
  if (!events.length) return;
  useNotificationLedger.getState().log(events);
  if (!isSupabaseConfigured) return;
  supabase.auth.getSession().then(({ data }) => {
    const uid = data.session?.user?.id;
    if (!uid) return;
    const rows = events.map((e) => ({
      user_id: uid,
      event_id: e.eventId ?? null,
      notification_type: e.type ?? null,
      content_id: e.contentId ?? null,
      content_version: e.contentVersion ?? null,
      channel: e.channel ?? null,
      status: e.status,
      phase_estimate: e.phase ?? null,
      confidence: e.confidence ?? null,
      detail: e.detail ?? null,
      occurred_at: new Date(e.at).toISOString(),
    }));
    supabase.from('notification_events').insert(rows).then(() => {}, () => {});
  }, () => {});
}

// ── Sync: plan → OS schedule ──────────────────────────────────────────────────

export type SyncArgs = Omit<PlanInput, 'library' | 'sent' | 'extrasToday' | 'now'> & { now?: Date };

/** Items whose time has come are "sent" — they count toward the cap and rotation. */
export function sentRecords(items: Record<string, LedgerItem>, now: number): SentRecord[] {
  return Object.values(items)
    .filter((i) => isSentStatus(i.status) || (i.pushScheduled && i.at <= now))
    .map((i) => ({ contentId: i.contentId, localDate: i.localDate, type: i.type, at: i.at }));
}

let chain: Promise<void> = Promise.resolve();

/** Serialised so overlapping triggers (log saved + app resumed) never race. */
export function syncNotifications(args: SyncArgs): Promise<void> {
  chain = chain.then(() => runSync(args)).catch(() => {});
  return chain;
}

async function runSync(args: SyncArgs): Promise<void> {
  const now = args.now ?? new Date();
  const nowMs = now.getTime();
  const lib = await getLibrary();
  const ledger = useNotificationLedger.getState();
  const prefsState = useNotificationPrefs.getState();
  const events: LoggedEvent[] = [];

  // Pushes whose time has passed were delivered by the OS.
  const due = Object.values(ledger.items).filter((i) => i.status === 'planned' && i.pushScheduled && i.at <= nowMs);
  due.forEach((i) => ledger.patchItem(i.eventId, { status: 'sent' }));

  const items = useNotificationLedger.getState().items;
  const today = todayISO(now);
  const plan = buildPlan({
    ...args,
    now,
    library: lib,
    sent: sentRecords(items, nowMs),
  });

  const permission = isSupported ? ((await hasPushPermission()) ? 'granted' : 'denied') : 'unsupported';
  const pushAllowed = permission === 'granted' && args.prefs.enabled;

  if (isSupported) {
    try {
      installNotificationHandler();
      await ensureChannel();
      // Earlier versions scheduled fixed daily repeats with random ids: clear them once.
      if (!useNotificationLedger.getState().legacyCleared) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        useNotificationLedger.getState().set({ legacyCleared: true });
      }
    } catch {}
  }

  const desired = plan.items.filter((i) => i.channel === 'push' && pushAllowed);
  const desiredIds = new Set(desired.map((i) => i.eventId));

  // Cancel or replace anything stale in the OS queue.
  let scheduled: Notifications.NotificationRequest[] = [];
  if (isSupported) {
    try {
      scheduled = (await Notifications.getAllScheduledNotificationsAsync()).filter((r) =>
        r.identifier.startsWith(ID_PREFIX),
      );
    } catch {}
  }
  for (const req of scheduled) {
    if (desiredIds.has(req.identifier)) continue;
    try {
      await Notifications.cancelScheduledNotificationAsync(req.identifier);
      const old = items[req.identifier];
      if (old) events.push(eventFor(old, 'cancelled', 'push'));
    } catch {}
  }

  const descriptive = prefsState.descriptivePreviews;
  const scheduledOk = new Set<string>();
  for (const item of desired) {
    const existing = scheduled.find((r) => r.identifier === item.eventId);
    const data = existing?.content.data as Record<string, unknown> | undefined;
    const title = descriptive ? item.title : item.lockTitle;
    const body = descriptive ? item.body : item.lockBody;
    if (
      existing &&
      data?.contentId === item.contentId &&
      data?.at === item.at &&
      existing.content.title === title &&
      existing.content.body === body
    ) {
      scheduledOk.add(item.eventId);
      continue;
    }
    const request = {
      identifier: item.eventId, // same id = replaces, never duplicates
      content: {
        title,
        body,
        data: {
          cyclealign: 1,
          eventId: item.eventId,
          type: item.type,
          contentId: item.contentId,
          localDate: item.localDate,
          link: item.link,
          at: item.at,
        },
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(item.at), channelId: ANDROID_CHANNEL },
    } as Notifications.NotificationRequestInput;
    // Bounded retry: one more attempt for a transient failure, then log it.
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try {
        await Notifications.scheduleNotificationAsync(request);
        ok = true;
      } catch (e) {
        if (attempt === 1) events.push(eventFor(item, 'failed', 'push', String((e as Error)?.message ?? e).slice(0, 120)));
      }
    }
    if (ok) {
      scheduledOk.add(item.eventId);
      events.push(eventFor(item, existing ? 'replaced' : 'scheduled', 'push'));
    }
  }

  // Ledger: drop future events that are no longer planned, store the new plan.
  const planIds = new Set(plan.items.map((i) => i.eventId));
  const obsolete = Object.values(useNotificationLedger.getState().items)
    .filter((i) => i.status === 'planned' && !planIds.has(i.eventId) && (i.at > nowMs || i.channel === 'in_app'))
    .map((i) => i.eventId);
  useNotificationLedger.getState().removeItems(obsolete);

  const current = useNotificationLedger.getState().items;
  useNotificationLedger.getState().upsertItems(
    plan.items.map((i) => {
      const prev = current[i.eventId];
      if (prev && prev.status !== 'planned') return prev; // already handled
      return { ...i, status: 'planned', pushScheduled: scheduledOk.has(i.eventId) };
    }),
  );

  const prevTz = useNotificationLedger.getState().lastSync?.timeZone;
  const timeZone = currentTimeZone();
  if (prevTz && prevTz !== timeZone) events.push({ at: nowMs, status: 'timezone_changed' });

  const next = desired.filter((i) => scheduledOk.has(i.eventId)).sort((a, b) => a.at - b.at)[0];
  useNotificationLedger.getState().set({
    lastSync: {
      at: nowMs,
      timeZone,
      permission,
      phase: plan.today.phase,
      confidence: plan.today.confidence,
      dayOfCycle: plan.today.dayOfCycle,
      nextAt: next?.at ?? null,
      nextContentId: next?.contentId ?? null,
      scheduledCount: scheduledOk.size,
      skips: plan.skips.slice(0, 20),
    },
  });
  recordEvents(events);
  useNotificationLedger.getState().bumpPopup();
}

export function currentTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

// ── Extras (Retail Therapy, referral nudge) share the cap and quiet hours ─────

/**
 * Whether a non-daily interruptive notification may go out right now. It
 * must respect her master switch, quiet hours and the daily cap, which it
 * then consumes. Her own daily message and chosen reminders always come
 * first: anything still planned for today is counted before an extra.
 */
export function claimExtraSlot(now = new Date()): boolean {
  const prefs = useNotificationPrefs.getState();
  if (prefs.enabled === false) return false;
  const lib = currentLibrary();
  if (isQuietNow(now, lib.config)) return false;
  const ledger = useNotificationLedger.getState();
  const today = todayISO(now);
  const usedToday = Object.values(ledger.items).filter(
    (i) => i.localDate === today && (i.status !== 'planned' || i.pushScheduled || i.channel === 'in_app'),
  ).length;
  if (usedToday + (ledger.extras[today] ?? 0) >= lib.config.dailyCap) return false;
  ledger.addExtra(today);
  return true;
}

// ── Sign-out / opt-out ────────────────────────────────────────────────────────

/** Stops every pending notification (opt-out). Prefs are kept. */
export async function cancelAllNotifications(): Promise<void> {
  if (!isSupported) return;
  try {
    const pending = (await Notifications.getAllScheduledNotificationsAsync()).filter((r) =>
      r.identifier.startsWith(ID_PREFIX),
    );
    await Promise.all(pending.map((r) => Notifications.cancelScheduledNotificationAsync(r.identifier)));
  } catch {}
}

/**
 * Account change: the next person on this device must never see the last
 * account's cycle content — clear pending and delivered notifications, the
 * ledger and the preferences.
 */
export async function resetNotificationsForSignOut(): Promise<void> {
  useNotificationLedger.getState().reset();
  useNotificationPrefs.getState().reset();
  if (!isSupported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  } catch {}
}

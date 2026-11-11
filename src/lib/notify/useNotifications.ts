import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { selectLastPeriodStart, useAppStore } from '@/lib/stores/useAppStore';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useNotificationPrefs } from '@/lib/stores/useNotificationPrefs';
import { useNotificationLedger } from '@/lib/stores/useNotificationLedger';
import { phaseReliability, resolveMode } from '@/lib/adaptive/mode';
import { todayISO } from '@/lib/dates';
import type { PlanInput } from './decide';
import { resolveTap } from './deepLinks';
import {
  currentLibrary,
  eventFor,
  hasPushPermission,
  installNotificationHandler,
  isSupported,
  recordEvents,
  sentRecords,
  syncNotifications,
  type SyncArgs,
} from './service';

/** Everything the decision service needs, read from the app's own stores. */
export function readSyncArgs(): SyncArgs | null {
  const app = useAppStore.getState();
  const profile = app.profile;
  if (!profile) return null;
  const prefs = useNotificationPrefs.getState();
  return {
    userKey: profile.id,
    prefs: {
      enabled: prefs.enabled === true,
      dailyHour: prefs.dailyHour,
      dailyMinute: prefs.dailyMinute,
      eveningCheckin: prefs.eveningCheckin,
      eveningHour: prefs.eveningHour,
      eveningMinute: prefs.eveningMinute,
      periodConfirm: prefs.periodConfirm,
    },
    cycle: {
      mode: resolveMode(profile),
      reliability: phaseReliability(profile, app.cycleLogs),
      lastPeriodStart: selectLastPeriodStart(app),
      avgCycleLength: profile.avgCycleLength,
      avgPeriodLength: profile.avgPeriodLength,
      history: app.cycleLogs,
    },
    dailyLogs: useDailyLog.getState().logs,
  };
}

/** Full planner input for revalidating an item right before it is shown. */
export function readPlanInput(now = new Date()): PlanInput | null {
  const args = readSyncArgs();
  if (!args) return null;
  return {
    ...args,
    now,
    library: currentLibrary(),
    sent: sentRecords(useNotificationLedger.getState().items, now.getTime()),
  };
}

export function resyncNotifications() {
  const args = readSyncArgs();
  if (args) syncNotifications(args);
}

/**
 * Keeps the schedule current. Re-plans when her period dates, logs or
 * preferences change, when the app returns to the foreground, and therefore
 * also after a day change or a time-zone change.
 */
export function useNotificationSync() {
  const profile = useAppStore((s) => s.profile);
  const cycleLogs = useAppStore((s) => s.cycleLogs);
  const logs = useDailyLog((s) => s.logs);
  const prefs = useNotificationPrefs();
  const todayLog = logs[todayISO()];
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return todayISO(d);
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Accounts from before preferences were saved: if she already allowed
  // CycleAlign's notifications in the OS, keep them on; otherwise off.
  useEffect(() => {
    if (prefs.enabled !== null) return;
    hasPushPermission().then((granted) => useNotificationPrefs.getState().set({ enabled: granted }));
  }, [prefs.enabled]);

  const schedule = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(resyncNotifications, 400);
  };

  useEffect(schedule, [
    profile?.id,
    profile?.avgCycleLength,
    profile?.avgPeriodLength,
    profile?.cycleRegularity,
    profile?.healthContext,
    cycleLogs,
    todayLog,
    logs[yesterdayKey],
    prefs.enabled,
    prefs.dailyHour,
    prefs.dailyMinute,
    prefs.eveningCheckin,
    prefs.eveningHour,
    prefs.eveningMinute,
    prefs.periodConfirm,
    prefs.descriptivePreviews,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') schedule();
    });
    return () => {
      sub.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}

/**
 * Root-level listeners: a push arriving while the app is open becomes the
 * in-app pop-up, and a tapped push opens its screen (cold start included).
 */
export function useNotificationListeners() {
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!isSupported) return;
    installNotificationHandler();

    const received = Notifications.addNotificationReceivedListener((n) => {
      const data = (n.request.content.data ?? {}) as Record<string, unknown>;
      if (data.cyclealign !== 1 || typeof data.eventId !== 'string') return;
      const ledger = useNotificationLedger.getState();
      const item = ledger.items[data.eventId];
      if (!item) return;
      const inApp = useNotificationPrefs.getState().inApp;
      ledger.patchItem(item.eventId, { status: 'sent', receivedForeground: inApp });
      recordEvents([eventFor(item, 'delivered', 'push', 'foreground')]);
      ledger.bumpPopup();
    });

    const onResponse = (r: Notifications.NotificationResponse | null) => {
      if (!r) return;
      const id = r.notification.request.identifier;
      if (handled.current.has(id + r.notification.date)) return;
      handled.current.add(id + r.notification.date);
      const data = (r.notification.request.content.data ?? {}) as Record<string, unknown>;
      if (data.cyclealign !== 1) return;
      handleTap(data);
    };

    const response = Notifications.addNotificationResponseReceivedListener(onResponse);
    Notifications.getLastNotificationResponseAsync().then(onResponse, () => {});
    return () => {
      received.remove();
      response.remove();
    };
  }, []);
}

function handleTap(data: Record<string, unknown>) {
  const ledger = useNotificationLedger.getState();
  const app = useAppStore.getState();
  const eventId = typeof data.eventId === 'string' ? data.eventId : null;
  const item = eventId ? ledger.items[eventId] : undefined;
  const now = Date.now();
  ledger.set({ lastTapAt: now });
  if (item) {
    ledger.patchItem(item.eventId, { status: 'opened' });
    recordEvents([eventFor(item, 'opened', 'push')]);
  }
  const args = readSyncArgs();
  const phase = useNotificationLedger.getState().lastSync?.phase ?? null;
  const tap = resolveTap(data, {
    signedIn: !!app.profile && app.onboardingComplete,
    todayISO: todayISO(),
    phase,
    hasPeriodDate: !!args?.cycle.lastPeriodStart,
  });
  if (tap.route === '/') return; // signed out: the launch gate takes over
  ledger.set({ pendingRoute: tap.route, notice: tap.notice });
}

/**
 * Opens the route of a tapped notification once the signed-in app is on
 * screen (mounted inside the tabs, so a cold start finishes routing first).
 */
export function usePendingNotificationRoute() {
  const pending = useNotificationLedger((s) => s.pendingRoute);
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => {
      useNotificationLedger.getState().set({ pendingRoute: null });
      try {
        router.push(pending as never);
      } catch {
        recordEvents([{ at: Date.now(), status: 'deep_link_failed', detail: pending.slice(0, 60) }]);
        try {
          router.replace('/(tabs)/today');
        } catch {}
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pending]);
}

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Confidence, PlannedItem, SkipRecord } from '@/lib/notify/decide';
import type { PhaseKey } from '@/types/models';

/**
 * Device-local record of every planned notification event and what happened
 * to it. Drives de-duplication, the daily cap, message rotation, the in-app
 * pop-up and the QA screen. Event logs hold ids and statuses only — never the
 * message text or anything she typed.
 */

export type ItemStatus = 'planned' | 'sent' | 'shown' | 'opened' | 'dismissed';

export interface LedgerItem extends PlannedItem {
  status: ItemStatus;
  /** A push was handed to the OS for this event. */
  pushScheduled: boolean;
  /** The push arrived while the app was open (shown as a pop-up instead). */
  receivedForeground?: boolean;
}

export type EventStatus =
  | 'scheduled'
  | 'replaced'
  | 'cancelled'
  | 'failed'
  | 'delivered'
  | 'shown'
  | 'opened'
  | 'dismissed'
  | 'deep_link_failed'
  | 'opt_in'
  | 'opt_out'
  | 'timezone_changed';

export interface LoggedEvent {
  at: number;
  status: EventStatus;
  eventId?: string;
  type?: string;
  contentId?: string;
  contentVersion?: number;
  channel?: 'push' | 'in_app';
  phase?: PhaseKey | null;
  confidence?: Confidence;
  detail?: string;
}

export interface SyncSnapshot {
  at: number;
  timeZone: string;
  permission: 'granted' | 'denied' | 'unsupported';
  phase: PhaseKey | null;
  confidence: Confidence;
  dayOfCycle: number | null;
  nextAt: number | null;
  nextContentId: string | null;
  scheduledCount: number;
  skips: SkipRecord[];
}

interface State {
  items: Record<string, LedgerItem>;
  events: LoggedEvent[];
  /** Interruptive extras (Retail Therapy, referral) per local date. */
  extras: Record<string, number>;
  /** Last time she tapped one of our notifications (pop-up suppression). */
  lastTapAt: number | null;
  /** Route to open once the app is ready (set by a notification tap). */
  pendingRoute: string | null;
  notice: string | null;
  lastSync: SyncSnapshot | null;
  /** Old fixed-time schedules from earlier versions have been cleared. */
  legacyCleared: boolean;
  /** Bumped when something may make a pop-up eligible. */
  popupTick: number;

  upsertItems: (items: LedgerItem[]) => void;
  patchItem: (eventId: string, patch: Partial<LedgerItem>) => void;
  removeItems: (eventIds: string[]) => void;
  log: (events: LoggedEvent | LoggedEvent[]) => void;
  addExtra: (dateISO: string) => void;
  set: (patch: Partial<Pick<State, 'lastTapAt' | 'pendingRoute' | 'notice' | 'lastSync' | 'legacyCleared'>>) => void;
  bumpPopup: () => void;
  reset: () => void;
}

const MAX_EVENTS = 200;
const KEEP_DAYS = 30;

const initial = {
  items: {} as Record<string, LedgerItem>,
  events: [] as LoggedEvent[],
  extras: {} as Record<string, number>,
  lastTapAt: null as number | null,
  pendingRoute: null as string | null,
  notice: null as string | null,
  lastSync: null as SyncSnapshot | null,
  legacyCleared: false,
  popupTick: 0,
};

function prune(items: Record<string, LedgerItem>): Record<string, LedgerItem> {
  const cutoff = Date.now() - KEEP_DAYS * 86_400_000;
  return Object.fromEntries(Object.entries(items).filter(([, i]) => i.at >= cutoff));
}

export const useNotificationLedger = create<State>()(
  persist(
    (set) => ({
      ...initial,
      upsertItems: (items) =>
        set((s) => {
          const next = { ...s.items };
          items.forEach((i) => (next[i.eventId] = i));
          return { items: prune(next) };
        }),
      patchItem: (eventId, patch) =>
        set((s) => (s.items[eventId] ? { items: { ...s.items, [eventId]: { ...s.items[eventId], ...patch } } } : {})),
      removeItems: (ids) =>
        set((s) => {
          const next = { ...s.items };
          ids.forEach((id) => delete next[id]);
          return { items: next };
        }),
      log: (events) =>
        set((s) => ({ events: [...s.events, ...(Array.isArray(events) ? events : [events])].slice(-MAX_EVENTS) })),
      addExtra: (dateISO) =>
        set((s) => ({ extras: { [dateISO]: (s.extras[dateISO] ?? 0) + 1 } })),
      set: (patch) => set(patch),
      bumpPopup: () => set((s) => ({ popupTick: s.popupTick + 1 })),
      reset: () => set({ ...initial, legacyCleared: true }),
    }),
    {
      name: 'cyclealign-notification-ledger',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        items: s.items,
        events: s.events,
        extras: s.extras,
        lastTapAt: s.lastTapAt,
        lastSync: s.lastSync,
        legacyCleared: s.legacyCleared,
      }),
    },
  ),
);

const SENT: ItemStatus[] = ['sent', 'shown', 'opened', 'dismissed'];
export const isSentStatus = (s: ItemStatus) => SENT.includes(s);

/**
 * The scheduling service against an in-memory OS notification mockQueue:
 * retries never duplicate, permission is respected, opt-out and sign-out
 * clear the mockQueue, and a corrected period date replaces queued content.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/lib/supabase', () => ({ isSupabaseConfigured: false, supabase: {} }));

type Req = { identifier: string; content: { title: string; body: string; data: Record<string, unknown> }; trigger: unknown };
const mockQueue = new Map<string, Req>();
let mockGranted = true;
let mockFailNext = 0;
let mockScheduleCalls = 0;

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: mockGranted, canAskAgain: true, status: mockGranted ? 'granted' : 'denied' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: mockGranted })),
  getAllScheduledNotificationsAsync: jest.fn(async () => Array.from(mockQueue.values())),
  scheduleNotificationAsync: jest.fn(async (r: Req) => {
    mockScheduleCalls++;
    if (mockFailNext > 0) {
      mockFailNext--;
      throw new Error('transient');
    }
    mockQueue.set(r.identifier, r); // same identifier replaces, like the OS
    return r.identifier;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => void mockQueue.delete(id)),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => mockQueue.clear()),
  dismissAllNotificationsAsync: jest.fn(async () => null),
}));

import { addDaysISO } from '@/lib/dates';
import type { SyncArgs } from '../service';
import { cancelAllNotifications, claimExtraSlot, resetNotificationsForSignOut, syncNotifications } from '../service';
import { useNotificationLedger } from '@/lib/stores/useNotificationLedger';
import { useNotificationPrefs } from '@/lib/stores/useNotificationPrefs';

const NOW = new Date(2026, 10, 11, 7, 0, 0);
const TODAY = '2026-11-11';

function args(day = 8, over: Partial<SyncArgs['prefs']> = {}): SyncArgs {
  const last = addDaysISO(TODAY, -(day - 1));
  return {
    now: NOW,
    userKey: 'user-1',
    prefs: { enabled: true, dailyHour: 9, dailyMinute: 0, eveningCheckin: false, eveningHour: 20, eveningMinute: 0, periodConfirm: false, ...over },
    cycle: {
      mode: 'regular',
      reliability: 'reliable',
      lastPeriodStart: last,
      avgCycleLength: 28,
      avgPeriodLength: 5,
      history: [
        { id: 'a', userId: 'u', startDate: last },
        { id: 'b', userId: 'u', startDate: addDaysISO(last, -28) },
      ],
    },
    dailyLogs: { [TODAY]: { dateISO: TODAY, energy: 3, mood: 'ok', win: '' } },
  };
}

beforeEach(() => {
  mockQueue.clear();
  mockGranted = true;
  mockFailNext = 0;
  mockScheduleCalls = 0;
  useNotificationLedger.getState().reset();
  useNotificationPrefs.getState().reset();
  useNotificationPrefs.getState().set({ enabled: true });
});

it('AT-06: running the job repeatedly never duplicates a notification', async () => {
  await syncNotifications(args());
  const first = Array.from(mockQueue.keys());
  await syncNotifications(args());
  await syncNotifications(args());
  expect(Array.from(mockQueue.keys())).toEqual(first);
  expect(first).toHaveLength(7);
  // Unchanged items are not even re-sent to the OS.
  expect(mockScheduleCalls).toBe(7);
});

it('AT-05: at most the daily cap per day in the OS queue', async () => {
  await syncNotifications(args(29, { eveningCheckin: true, periodConfirm: true }));
  const perDay: Record<string, number> = {};
  mockQueue.forEach((r) => {
    const d = r.content.data.localDate as string;
    perDay[d] = (perDay[d] ?? 0) + 1;
  });
  Object.values(perDay).forEach((n) => expect(n).toBeLessThanOrEqual(2));
});

it('retries a transient failure once, then logs it', async () => {
  mockFailNext = 1;
  await syncNotifications(args());
  expect(mockQueue.size).toBe(7);
  mockFailNext = 2;
  mockQueue.clear();
  useNotificationLedger.getState().reset();
  await syncNotifications(args());
  expect(useNotificationLedger.getState().events.some((e) => e.status === 'failed')).toBe(true);
});

it('AT-10: no push without OS permission, but the plan is kept for in-app', async () => {
  mockGranted = false;
  await syncNotifications(args());
  expect(mockQueue.size).toBe(0);
  const items = Object.values(useNotificationLedger.getState().items);
  expect(items).toHaveLength(7);
  expect(items.every((i) => !i.pushScheduled)).toBe(true);
  expect(useNotificationLedger.getState().lastSync?.permission).toBe('denied');
});

it('AT-11: a corrected period date replaces queued content under the same id', async () => {
  await syncNotifications(args(8));
  const id = Array.from(mockQueue.keys())[0];
  const before = mockQueue.get(id)!.content.data.contentId;
  await syncNotifications(args(2));
  expect(mockQueue.get(id)!.content.data.contentId).not.toBe(before);
  expect(mockQueue.size).toBe(7);
  expect(useNotificationLedger.getState().events.some((e) => e.status === 'replaced')).toBe(true);
});

it('AT-12: turning notifications or a reminder off cancels what is pending', async () => {
  await syncNotifications(args(8, { eveningCheckin: true }));
  expect(Array.from(mockQueue.values()).some((r) => r.content.data.type === 'symptom_checkin')).toBe(true);
  await syncNotifications(args(8, { eveningCheckin: false }));
  expect(Array.from(mockQueue.values()).some((r) => r.content.data.type === 'symptom_checkin')).toBe(false);
  await syncNotifications(args(8, { enabled: false }));
  expect(mockQueue.size).toBe(0);
  await syncNotifications(args(8));
  await cancelAllNotifications();
  expect(mockQueue.size).toBe(0);
});

it('AT-14: the OS gets neutral lock-screen copy unless she opts in', async () => {
  await syncNotifications(args(2));
  mockQueue.forEach((r) => expect(r.content.body).toBe("Tap to open today's guidance in CycleAlign."));
  useNotificationPrefs.getState().set({ descriptivePreviews: true });
  await syncNotifications(args(2));
  expect(Array.from(mockQueue.values()).some((r) => /period/i.test(r.content.body))).toBe(true);
});

it('AT-16: events carry ids and statuses, never message text', async () => {
  await syncNotifications(args(2));
  const events = useNotificationLedger.getState().events;
  expect(events.length).toBeGreaterThan(0);
  events.forEach((e) => {
    expect(Object.keys(e)).not.toContain('title');
    expect(Object.keys(e)).not.toContain('body');
  });
});

it('sign-out clears the queue, the ledger and the preferences', async () => {
  await syncNotifications(args());
  await resetNotificationsForSignOut();
  expect(mockQueue.size).toBe(0);
  expect(Object.keys(useNotificationLedger.getState().items)).toHaveLength(0);
  expect(useNotificationPrefs.getState().enabled).toBeNull();
});

it('extras (Retail Therapy, referral) yield to her own messages and the cap', async () => {
  // Not logged yet today: the 09:00 message and the 20:00 check-in fill today's cap.
  await syncNotifications({ ...args(8, { eveningCheckin: true }), dailyLogs: {} });
  const realNow = Date.now;
  Date.now = () => new Date(2026, 10, 11, 12, 0).getTime();
  try {
    expect(claimExtraSlot(new Date(2026, 10, 11, 12, 0))).toBe(false);
    expect(claimExtraSlot(new Date(2026, 10, 11, 22, 0))).toBe(false); // quiet hours
  } finally {
    Date.now = realNow;
  }
});

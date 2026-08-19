import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDaysISO, todayISO } from '@/lib/dates';

export interface CalendarEvent {
  id: string;
  title: string;
  categoryId: string;   // maps to TASK_SYNC_CATEGORIES id
  dateISO: string;
  timeLabel: string;    // e.g. "10:00 AM"
  isPrivate: boolean;
}

// ── Demo events seeded relative to today ────────────────────────────────────

function seedEvents(): CalendarEvent[] {
  const t = todayISO();
  return [
    { id: 'ev-1',  title: 'Team standup',            categoryId: 'MEETING',    dateISO: t,                  timeLabel: '9:30 AM',  isPrivate: false },
    { id: 'ev-2',  title: 'Board presentation',       categoryId: 'HIGH_CONVO', dateISO: addDaysISO(t, 2),  timeLabel: '2:00 PM',  isPrivate: false },
    { id: 'ev-3',  title: 'Strategy deep-work block', categoryId: 'DEEP_FOCUS', dateISO: addDaysISO(t, 3),  timeLabel: '10:00 AM', isPrivate: false },
    { id: 'ev-4',  title: 'Investor pitch',            categoryId: 'HIGH_CONVO', dateISO: addDaysISO(t, 5),  timeLabel: '3:00 PM',  isPrivate: false },
    { id: 'ev-5',  title: 'Performance review',        categoryId: 'HIGH_CONVO', dateISO: addDaysISO(t, 7),  timeLabel: '11:00 AM', isPrivate: false },
    { id: 'ev-6',  title: 'Admin & emails',            categoryId: 'ADMIN',      dateISO: addDaysISO(t, 8),  timeLabel: '9:00 AM',  isPrivate: false },
    { id: 'ev-7',  title: 'Client presentation',       categoryId: 'HIGH_CONVO', dateISO: addDaysISO(t, 10), timeLabel: '1:00 PM',  isPrivate: false },
    { id: 'ev-8',  title: 'Project planning session',  categoryId: 'DECISION',   dateISO: addDaysISO(t, 11), timeLabel: '10:00 AM', isPrivate: false },
    { id: 'ev-9',  title: 'Team retrospective',        categoryId: 'MEETING',    dateISO: addDaysISO(t, 12), timeLabel: '3:00 PM',  isPrivate: false },
    { id: 'ev-10', title: 'Private appointment',       categoryId: 'PERSONAL',   dateISO: addDaysISO(t, 14), timeLabel: '2:00 PM',  isPrivate: true  },
    { id: 'ev-11', title: 'Creative brainstorm',       categoryId: 'DEEP_FOCUS', dateISO: addDaysISO(t, 15), timeLabel: '11:00 AM', isPrivate: false },
    { id: 'ev-12', title: 'Salary negotiation',        categoryId: 'HIGH_CONVO', dateISO: addDaysISO(t, 17), timeLabel: '2:30 PM',  isPrivate: false },
    { id: 'ev-13', title: 'Weekly sync',               categoryId: 'MEETING',    dateISO: addDaysISO(t, 19), timeLabel: '10:00 AM', isPrivate: false },
    { id: 'ev-14', title: 'Quarterly planning',        categoryId: 'DECISION',   dateISO: addDaysISO(t, 21), timeLabel: '9:00 AM',  isPrivate: false },
    { id: 'ev-15', title: 'Product launch',            categoryId: 'HIGH_CONVO', dateISO: addDaysISO(t, 23), timeLabel: '12:00 PM', isPrivate: false },
  ];
}

interface CalendarState {
  connected: boolean;
  /** 'demo' | 'google' | 'apple' | 'outlook' | null */
  providerLabel: string | null;
  googleAccessToken: string | null;
  /**
   * Google access tokens expire after ~1 hour. Without a refresh token,
   * every re-sync after that silently fails forever (only a full
   * disconnect/reconnect gets a working token again) — this is what lets
   * refreshEvents() mint a new access token instead.
   */
  googleRefreshToken: string | null;
  events: CalendarEvent[];
  /** Connect with real Google Calendar data. */
  connectGoogle: (accessToken: string, events: CalendarEvent[], refreshToken?: string | null) => void;
  /** Swap in a freshly minted access token without resetting events/refresh token. */
  updateGoogleAccessToken: (accessToken: string) => void;
  /** Connect with real on-device Apple Calendar (EventKit) data. */
  connectAppleCalendar: (events: CalendarEvent[]) => void;
  /** Connect with seeded demo data (Outlook / sample, or Apple on non-iOS). */
  connectDemo: (providerLabel?: string) => void;
  /** Backwards-compat alias for connectDemo. */
  connect: () => void;
  disconnect: () => void;
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  removeEvent: (id: string) => void;
  eventsForDate: (dateISO: string) => CalendarEvent[];
}

export const useCalendar = create<CalendarState>()(
  persist(
    (set, get) => ({
      connected: false,
      providerLabel: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      events: [],

      connectGoogle: (accessToken, events, refreshToken) =>
        set((s) => ({
          connected: true,
          providerLabel: 'Google Calendar',
          googleAccessToken: accessToken,
          // A reconnect may not always return a fresh refresh token (Google
          // only issues one reliably on first consent) — keep the existing
          // one rather than wiping it out with undefined.
          googleRefreshToken: refreshToken ?? s.googleRefreshToken,
          events,
        })),

      updateGoogleAccessToken: (accessToken) =>
        set({ googleAccessToken: accessToken }),

      connectAppleCalendar: (events) =>
        set({ connected: true, providerLabel: 'Apple Calendar', googleAccessToken: null, googleRefreshToken: null, events }),

      connectDemo: (label = 'Calendar') =>
        set({ connected: true, providerLabel: label, googleAccessToken: null, googleRefreshToken: null, events: seedEvents() }),

      connect: () =>
        set({ connected: true, providerLabel: 'Calendar', googleAccessToken: null, googleRefreshToken: null, events: seedEvents() }),

      disconnect: () =>
        set({ connected: false, providerLabel: null, googleAccessToken: null, googleRefreshToken: null, events: [] }),

      addEvent: (e) =>
        set((s) => ({
          events: [...s.events, { ...e, id: `ev-${Date.now()}` }],
        })),

      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      eventsForDate: (dateISO) =>
        get().events.filter((e) => e.dateISO === dateISO),
    }),
    {
      name: 'cyclealign-calendar',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        connected: s.connected,
        providerLabel: s.providerLabel,
        googleAccessToken: s.googleAccessToken,
        googleRefreshToken: s.googleRefreshToken,
        events: s.events,
      }),
    },
  ),
);

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
  /** Local start/end as minutes from midnight, when the source has real times. */
  startMin?: number;
  endMin?: number;
  isPrivate: boolean;
}

/** Sample events only carry a "9:30 AM" label — derive real minutes (1h long) so they behave like synced ones. */
export function withMinutes(e: CalendarEvent): CalendarEvent {
  if (e.startMin !== undefined) return e;
  const m = /(\d{1,2}):(\d{2})\s?(AM|PM)?/i.exec(e.timeLabel ?? '');
  if (!m) return e;
  let h = parseInt(m[1], 10);
  const mer = m[3]?.toUpperCase();
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  const startMin = h * 60 + parseInt(m[2], 10);
  return { ...e, startMin, endMin: startMin + 60 };
}

function minutesToLabel(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
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
  outlookAccessToken: string | null;
  /** Microsoft rotates the refresh token on every use, unlike Google's. */
  outlookRefreshToken: string | null;
  events: CalendarEvent[];
  /** Connect with real Google Calendar data. */
  connectGoogle: (accessToken: string, events: CalendarEvent[], refreshToken?: string | null) => void;
  /** Swap in a freshly minted access token without resetting events/refresh token. */
  updateGoogleAccessToken: (accessToken: string) => void;
  /** Connect with real Outlook / Microsoft 365 Calendar data. */
  connectOutlook: (accessToken: string, events: CalendarEvent[], refreshToken?: string | null) => void;
  /** Connect with real on-device Apple Calendar (EventKit) data. */
  connectAppleCalendar: (events: CalendarEvent[]) => void;
  /** Connect with seeded demo data (Outlook / sample, or Apple on non-iOS). */
  connectDemo: (providerLabel?: string, extraEvents?: CalendarEvent[]) => void;
  /** Backwards-compat alias for connectDemo. */
  connect: () => void;
  disconnect: () => void;
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  removeEvent: (id: string) => void;
  /** Updates an event's date locally after it was moved (in the provider, or in the sample calendar). */
  moveEvent: (id: string, dateISO: string, deltaMin?: number) => void;
  eventsForDate: (dateISO: string) => CalendarEvent[];
}

export const useCalendar = create<CalendarState>()(
  persist(
    (set, get) => ({
      connected: false,
      providerLabel: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      outlookAccessToken: null,
      outlookRefreshToken: null,
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
          outlookAccessToken: null,
          outlookRefreshToken: null,
          events,
        })),

      updateGoogleAccessToken: (accessToken) =>
        set({ googleAccessToken: accessToken }),

      connectOutlook: (accessToken, events, refreshToken) =>
        set((s) => ({
          connected: true,
          providerLabel: 'Outlook Calendar',
          googleAccessToken: null,
          googleRefreshToken: null,
          outlookAccessToken: accessToken,
          // Microsoft rotates the refresh token on every use, so a fresh one
          // should normally always be present — but keep the existing one
          // rather than wiping it out on the off chance it isn't returned.
          outlookRefreshToken: refreshToken ?? s.outlookRefreshToken,
          events,
        })),

      connectAppleCalendar: (events) =>
        set({ connected: true, providerLabel: 'Apple Calendar', googleAccessToken: null, googleRefreshToken: null, outlookAccessToken: null, outlookRefreshToken: null, events }),

      connectDemo: (label = 'Calendar', extraEvents = []) =>
        set({ connected: true, providerLabel: label, googleAccessToken: null, googleRefreshToken: null, outlookAccessToken: null, outlookRefreshToken: null, events: [...seedEvents(), ...extraEvents].map(withMinutes) }),

      connect: () =>
        set({ connected: true, providerLabel: 'Calendar', googleAccessToken: null, googleRefreshToken: null, outlookAccessToken: null, outlookRefreshToken: null, events: seedEvents().map(withMinutes) }),

      disconnect: () =>
        set({ connected: false, providerLabel: null, googleAccessToken: null, googleRefreshToken: null, outlookAccessToken: null, outlookRefreshToken: null, events: [] }),

      addEvent: (e) =>
        set((s) => ({
          events: [...s.events, { ...e, id: `ev-${Date.now()}` }],
        })),

      removeEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      moveEvent: (id, dateISO, deltaMin = 0) =>
        set((s) => ({
          events: s.events.map((e) => {
            if (e.id !== id) return e;
            if (deltaMin === 0 || e.startMin === undefined || e.endMin === undefined) return { ...e, dateISO };
            const startMin = e.startMin + deltaMin;
            return { ...e, dateISO, startMin, endMin: e.endMin + deltaMin, timeLabel: minutesToLabel(startMin) };
          }),
        })),

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
        outlookAccessToken: s.outlookAccessToken,
        outlookRefreshToken: s.outlookRefreshToken,
        events: s.events,
      }),
    },
  ),
);

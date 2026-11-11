import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUNDLED_LIBRARY } from '@/lib/notify/library';

/**
 * Her notification choices. Persisted on this device (the old on/off switch
 * lived in a non-persisted store, so it silently turned itself off — and
 * cancelled every reminder — each time the app restarted).
 */
export interface NotificationPrefs {
  /** null = never chosen (accounts from before this store existed). */
  enabled: boolean | null;
  dailyHour: number;
  dailyMinute: number;
  /** Optional reminders: off until she turns them on. */
  eveningCheckin: boolean;
  eveningHour: number;
  eveningMinute: number;
  periodConfirm: boolean;
  /** Show the daily message as a pop-up while the app is open. */
  inApp: boolean;
  /** Off by default: the lock screen shows neutral wording only. */
  descriptivePreviews: boolean;
}

interface State extends NotificationPrefs {
  set: (patch: Partial<NotificationPrefs>) => void;
  reset: () => void;
}

const cfg = BUNDLED_LIBRARY.config;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: null,
  dailyHour: cfg.defaultHour,
  dailyMinute: cfg.defaultMinute,
  eveningCheckin: false,
  eveningHour: cfg.eveningHour,
  eveningMinute: cfg.eveningMinute,
  periodConfirm: false,
  inApp: true,
  descriptivePreviews: false,
};

export const useNotificationPrefs = create<State>()(
  persist(
    (set) => ({
      ...DEFAULT_NOTIFICATION_PREFS,
      set: (patch) => set(patch),
      reset: () => set(DEFAULT_NOTIFICATION_PREFS),
    }),
    {
      name: 'cyclealign-notification-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _s, reset: _r, ...prefs }) => prefs,
    },
  ),
);

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyLog } from '@/types/models';
import { pushDailyLog } from '@/lib/sync';

export type { DailyLog };

interface DailyLogState {
  logs: Record<string, DailyLog>;
  setLog: (log: DailyLog) => void;
  /** Wipe local logs — health data must not survive into another account's session. */
  reset: () => void;
}

export const useDailyLog = create<DailyLogState>()(
  persist(
    (set) => ({
      logs: {},
      setLog: (log) => {
        set((s) => ({ logs: { ...s.logs, [log.dateISO]: log } }));
        pushDailyLog(log).catch(() => {}); // fire-and-forget
      },
      reset: () => set({ logs: {} }),
    }),
    {
      name: 'cyclealign-daily-logs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const MOODS_QUICK = [
  { key: 'rough', emoji: '😣', label: 'Rough' },
  { key: 'low', emoji: '😕', label: 'Low' },
  { key: 'ok', emoji: '😐', label: 'Okay' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'great', emoji: '😄', label: 'Great' },
] as const;

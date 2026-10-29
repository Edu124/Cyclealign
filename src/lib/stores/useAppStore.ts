import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CycleLog, PhaseKey, Profile } from '@/types/models';
import { pushCycleLog, pushProfile, updateCycleLogDate } from '@/lib/sync';
import { periodLengthFromLogs } from '@/lib/prediction/periodLength';

interface AppState {
  profile: Profile | null;
  cycleLogs: CycleLog[];
  onboardingComplete: boolean;
  /** Becomes true once the persisted store has rehydrated from disk. */
  hydrated: boolean;
  /** Last phase she was notified for — lets a phase-change notification fire exactly once per transition. */
  lastNotifiedPhase: PhaseKey | null;

  setProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addCycleLog: (log: CycleLog) => void;
  /** Corrects the current (most recent) cycle's start/end dates. */
  editLastPeriodRange: (startDate: string, endDate: string) => void;
  setLastNotifiedPhase: (phase: PhaseKey) => void;
  completeOnboarding: () => void;
  reset: () => void;
  setHydrated: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      cycleLogs: [],
      onboardingComplete: false,
      hydrated: false,
      lastNotifiedPhase: null,

      setProfile: (profile) => {
        set({ profile });
        pushProfile(profile).catch(() => {});
      },
      updateProfile: (patch) => {
        set((s) => ({
          profile: s.profile ? { ...s.profile, ...patch } : s.profile,
        }));
        const updated = get().profile;
        if (updated) pushProfile(updated).catch(() => {});
      },
      addCycleLog: (log) => {
        set((s) => ({
          cycleLogs: [
            log,
            ...s.cycleLogs.filter((l) => l.startDate !== log.startDate),
          ].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
        }));
        pushCycleLog(log).catch(() => {});
      },
      editLastPeriodRange: (startDate, endDate) => {
        const logs = get().cycleLogs;
        const current = logs[0];
        if (!current || (current.startDate === startDate && current.endDate === endDate)) return;
        const oldStartDate = current.startDate;
        const updated: CycleLog = { ...current, startDate, endDate };
        set({
          cycleLogs: [
            updated,
            ...logs.slice(1).filter((l) => l.startDate !== startDate),
          ].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
        });
        updateCycleLogDate(oldStartDate, updated).catch(() => {});

        // The period she just marked is real data: predictions use her actual
        // period length from now on, not only the onboarding estimate.
        const profile = get().profile;
        if (profile) {
          const length = periodLengthFromLogs(get().cycleLogs, profile.avgPeriodLength);
          if (length !== profile.avgPeriodLength) get().updateProfile({ avgPeriodLength: length });
        }
      },
      setLastNotifiedPhase: (phase) => set({ lastNotifiedPhase: phase }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      reset: () =>
        set({ profile: null, cycleLogs: [], onboardingComplete: false, lastNotifiedPhase: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'cyclealign-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        profile: s.profile,
        cycleLogs: s.cycleLogs,
        onboardingComplete: s.onboardingComplete,
        lastNotifiedPhase: s.lastNotifiedPhase,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

/** Most recent period start, or null if none logged yet. */
export function selectLastPeriodStart(s: AppState): string | null {
  return s.cycleLogs[0]?.startDate ?? null;
}

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CycleLog, Profile } from '@/types/models';
import { pushCycleLog, pushProfile } from '@/lib/sync';

interface AppState {
  profile: Profile | null;
  cycleLogs: CycleLog[];
  onboardingComplete: boolean;
  /** Becomes true once the persisted store has rehydrated from disk. */
  hydrated: boolean;

  setProfile: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addCycleLog: (log: CycleLog) => void;
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
      completeOnboarding: () => set({ onboardingComplete: true }),
      reset: () =>
        set({ profile: null, cycleLogs: [], onboardingComplete: false }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'cyclealign-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        profile: s.profile,
        cycleLogs: s.cycleLogs,
        onboardingComplete: s.onboardingComplete,
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

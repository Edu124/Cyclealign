import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppVersion = 'v1' | 'v2';

interface SettingsState {
  /** Opt-in "Retail Therapy mode" — mood-triggered feel-good flash sales. */
  retailTherapy: boolean;
  /** App experience switch. V2 features land behind this flag. */
  appVersion: AppVersion;
  set: (partial: Partial<Pick<SettingsState, 'retailTherapy' | 'appVersion'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      retailTherapy: true,
      appVersion: 'v1',
      set: (partial) => set(partial),
    }),
    {
      name: 'cyclealign-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

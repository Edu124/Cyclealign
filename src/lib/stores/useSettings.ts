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
  /** Back to defaults — settings are device-local, so a new account must not inherit them. */
  reset: () => void;
}

const defaults = { retailTherapy: true, appVersion: 'v1' as AppVersion };

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (partial) => set(partial),
      reset: () => set(defaults),
    }),
    {
      name: 'cyclealign-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

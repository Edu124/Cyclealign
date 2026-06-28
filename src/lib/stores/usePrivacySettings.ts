import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SensitivityFilter = 'skip' | 'acknowledge' | 'analyse';

interface PrivacySettingsState {
  sensitivityFilter: SensitivityFilter;
  storeLabelsOnDevice: boolean;
  notificationTime: string; // 'HH:MM'
  set: (
    patch: Partial<Pick<PrivacySettingsState, 'sensitivityFilter' | 'storeLabelsOnDevice' | 'notificationTime'>>,
  ) => void;
}

export const usePrivacySettings = create<PrivacySettingsState>()(
  persist(
    (set) => ({
      sensitivityFilter: 'skip',
      storeLabelsOnDevice: true,
      notificationTime: '08:00',
      set: (patch) => set(patch),
    }),
    {
      name: 'cyclealign-privacy',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        sensitivityFilter: s.sensitivityFilter,
        storeLabelsOnDevice: s.storeLabelsOnDevice,
        notificationTime: s.notificationTime,
      }),
    },
  ),
);

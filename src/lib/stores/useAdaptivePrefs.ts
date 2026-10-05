import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdaptivePrefsState {
  /** She tapped "Not now" on the Personalize CycleAlign prompt. */
  personalizeDismissed: boolean;
  dismissPersonalize: () => void;
  /** Hide the clinician nudge until this date (ISO), after she dismisses it. */
  clinicianSnoozedUntil: string | null;
  snoozeClinician: (untilISO: string) => void;
  /** Suggestions she has rejected ("eventId|date|startMin") — never offered again. */
  ignored: Record<string, true>;
  ignoreSuggestion: (key: string) => void;
  reset: () => void;
}

export const useAdaptivePrefs = create<AdaptivePrefsState>()(
  persist(
    (set) => ({
      personalizeDismissed: false,
      dismissPersonalize: () => set({ personalizeDismissed: true }),
      clinicianSnoozedUntil: null,
      snoozeClinician: (untilISO) => set({ clinicianSnoozedUntil: untilISO }),
      ignored: {},
      ignoreSuggestion: (key) => set((st) => ({ ignored: { ...st.ignored, [key]: true } })),
      reset: () => set({ personalizeDismissed: false, clinicianSnoozedUntil: null, ignored: {} }),
    }),
    { name: 'cyclealign-adaptive-prefs', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

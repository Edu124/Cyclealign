import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PhaseKey } from '@/types/models';
import type { Allergen, DietPreference } from '@/lib/nutrition/guide';

export interface SavedNutritionTip {
  /** Stable key: "<phase>:reminder" or the meal option id. */
  id: string;
  phase: PhaseKey;
  kind: 'meal' | 'reminder';
  /** e.g. "Breakfast" for a meal; empty for a reminder. */
  label: string;
  text: string;
  savedAt: string;
}

interface NutritionPrefsState {
  diet: DietPreference;
  allergies: Allergen[];
  avoid: string[];
  saved: SavedNutritionTip[];
  setDiet: (diet: DietPreference) => void;
  toggleAllergy: (a: Allergen) => void;
  setAvoid: (words: string[]) => void;
  toggleSaved: (tip: Omit<SavedNutritionTip, 'savedAt'>) => void;
  reset: () => void;
}

/** Food preferences, allergies and saved tips stay on this device only. */
export const useNutritionPrefs = create<NutritionPrefsState>()(
  persist(
    (set) => ({
      diet: null,
      allergies: [],
      avoid: [],
      saved: [],
      setDiet: (diet) => set({ diet }),
      toggleAllergy: (a) =>
        set((s) => ({ allergies: s.allergies.includes(a) ? s.allergies.filter((x) => x !== a) : [...s.allergies, a] })),
      setAvoid: (words) => set({ avoid: words.map((w) => w.trim()).filter(Boolean) }),
      toggleSaved: (tip) =>
        set((s) =>
          s.saved.some((t) => t.id === tip.id)
            ? { saved: s.saved.filter((t) => t.id !== tip.id) }
            : { saved: [{ ...tip, savedAt: new Date().toISOString() }, ...s.saved] },
        ),
      reset: () => set({ diet: null, allergies: [], avoid: [], saved: [] }),
    }),
    { name: 'cyclealign-nutrition', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

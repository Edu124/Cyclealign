import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReferralPromptState {
  lastShownAt: string | null;
  markShown: () => void;
}

/** Tracks when the iOS reopen-triggered referral card last showed, so it can be throttled. */
export const useReferralPrompt = create<ReferralPromptState>()(
  persist(
    (set) => ({
      lastShownAt: null,
      markShown: () => set({ lastShownAt: new Date().toISOString() }),
    }),
    {
      name: 'cyclealign-referral-prompt',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

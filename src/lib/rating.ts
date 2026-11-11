import { Linking, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * In-app "rate CycleAlign" prompt.
 *
 * Store rules this follows:
 *  - No "Do you like the app?" gate before the rating, and no filtering of
 *    unhappy users away from the store (Google Play's in-app review policy and
 *    Apple's App Review Guideline 5.6.1 both disallow review gating).
 *  - Uses the stores' own in-app rating sheet when the build has it
 *    (expo-store-review); Apple and Google decide whether the sheet actually
 *    appears and limit how often (Apple: at most 3 times a year).
 *  - Asked rarely, at a calm moment, never during onboarding, never on top
 *    of another pop-up, and never again after "Rate" or "Don't ask again".
 */

export const IOS_APP_ID = '6788590698';
export const ANDROID_PACKAGE = 'com.cyclealign.app';

export const RATING_RULES = {
  minDaysSinceFirstOpen: 5,
  minActiveDays: 4,
  minCheckIns: 3,
  daysBetweenAsks: 30,
  maxAsks: 3,
};

export interface RatingState {
  firstSeenAt: number | null;
  /** Distinct local days the app was opened (capped list). */
  activeDays: string[];
  shownCount: number;
  lastShownAt: number | null;
  rated: boolean;
  optedOut: boolean;
}

interface Store extends RatingState {
  touch: (dayISO: string, now: number) => void;
  markShown: (now: number) => void;
  markRated: () => void;
  optOut: () => void;
}

export const useRatingPrompt = create<Store>()(
  persist(
    (set) => ({
      firstSeenAt: null,
      activeDays: [],
      shownCount: 0,
      lastShownAt: null,
      rated: false,
      optedOut: false,
      touch: (day, now) =>
        set((s) => ({
          firstSeenAt: s.firstSeenAt ?? now,
          activeDays: s.activeDays.includes(day) ? s.activeDays : [...s.activeDays, day].slice(-30),
        })),
      markShown: (now) => set((s) => ({ shownCount: s.shownCount + 1, lastShownAt: now })),
      markRated: () => set({ rated: true }),
      optOut: () => set({ optedOut: true }),
    }),
    {
      name: 'cyclealign-rating-prompt',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ touch: _t, markShown: _m, markRated: _r, optOut: _o, ...state }) => state,
    },
  ),
);

export interface RatingContext {
  now: number;
  platform: string;
  enabled: boolean;
  signedInAndOnboarded: boolean;
  checkIns: number;
  /** Another pop-up is showing or was just shown / tapped. */
  otherPromptRecently: boolean;
  quietHours: boolean;
}

/** Why the prompt may not show (null = it may). Pure, for tests and the QA screen. */
export function ratingBlockReason(s: RatingState, c: RatingContext): string | null {
  const day = 86_400_000;
  if (!c.enabled) return 'switched_off';
  if (c.platform !== 'ios' && c.platform !== 'android') return 'no_store_on_platform';
  if (!c.signedInAndOnboarded) return 'not_onboarded';
  if (s.rated) return 'already_rated';
  if (s.optedOut) return 'opted_out';
  if (s.shownCount >= RATING_RULES.maxAsks) return 'max_asks';
  if (!s.firstSeenAt || c.now - s.firstSeenAt < RATING_RULES.minDaysSinceFirstOpen * day) return 'too_new';
  if (s.activeDays.length < RATING_RULES.minActiveDays) return 'not_enough_active_days';
  if (c.checkIns < RATING_RULES.minCheckIns) return 'not_enough_check_ins';
  if (s.lastShownAt && c.now - s.lastShownAt < RATING_RULES.daysBetweenAsks * day) return 'asked_recently';
  if (c.quietHours) return 'quiet_hours';
  if (c.otherPromptRecently) return 'other_prompt';
  return null;
}

export function storeName(platform = Platform.OS): string {
  return platform === 'ios' ? 'the App Store' : 'Google Play';
}

export function storeReviewUrls(platform = Platform.OS): string[] {
  return platform === 'ios'
    ? [
        `itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`,
        `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`,
      ]
    : [`market://details?id=${ANDROID_PACKAGE}`, `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`];
}

type NativeStoreReview = { isAvailableAsync?: () => Promise<boolean>; requestReview?: () => Promise<void> };

/**
 * Opens the store's own rating sheet inside the app when this build includes
 * it. Builds made before expo-store-review was added don't have the native
 * module, so (instead of crashing) they open the store's review page.
 */
export async function openStoreReview(): Promise<'in_app' | 'store_page' | 'failed'> {
  try {
    const native = requireOptionalNativeModule<NativeStoreReview>('ExpoStoreReview');
    if (native?.requestReview && (await native.isAvailableAsync?.()) !== false) {
      await native.requestReview();
      return 'in_app';
    }
  } catch {}
  for (const url of storeReviewUrls()) {
    try {
      await Linking.openURL(url);
      return 'store_page';
    } catch {}
  }
  return 'failed';
}

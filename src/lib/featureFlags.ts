import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Remote on/off switches, so an enhancement can be turned off without an app
 * release or rolling back anything else. Edit the `feature_flags` row in
 * `app_content` (Supabase Table Editor), e.g. {"rhythmOnboarding": false}.
 * The last known values are kept on the device; a missing row or a network
 * error keeps the defaults below.
 */
export interface FeatureFlags {
  /** "Let's understand your rhythm" onboarding (15–90 day cycles, varies / not sure). */
  rhythmOnboarding: boolean;
  /** The in-app "rate CycleAlign" prompt. */
  ratingPrompt: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = { rhythmOnboarding: true, ratingPrompt: true };

interface State extends FeatureFlags {
  apply: (patch: Partial<FeatureFlags>) => void;
}

export const useFeatureFlags = create<State>()(
  persist(
    (set) => ({
      ...DEFAULT_FLAGS,
      apply: (patch) => set(patch),
    }),
    {
      name: 'cyclealign-feature-flags',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ apply: _a, ...flags }) => flags,
    },
  ),
);

export function parseFlags(raw: unknown): Partial<FeatureFlags> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Partial<FeatureFlags> = {};
  (Object.keys(DEFAULT_FLAGS) as (keyof FeatureFlags)[]).forEach((k) => {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === 'boolean') out[k] = v;
  });
  return out;
}

/** Fetched once per app start. Readable before sign-in (onboarding needs it). */
export async function refreshFeatureFlags(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const { data } = await supabase.from('app_content').select('data').eq('key', 'feature_flags').maybeSingle();
    const patch = parseFlags((data as { data?: unknown } | null)?.data);
    if (Object.keys(patch).length) useFeatureFlags.getState().apply(patch);
  } catch {}
}

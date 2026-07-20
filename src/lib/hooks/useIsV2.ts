import { useSettings } from '@/lib/stores/useSettings';

/**
 * Single source of truth for V2 gating. Currently the toggle is free for
 * everyone; when V2 becomes Premium-only again, re-add the subscription
 * check here (`&& useSubscription((s) => s.isPremium())`).
 */
export function useIsV2(): boolean {
  return useSettings((s) => s.appVersion) === 'v2';
}

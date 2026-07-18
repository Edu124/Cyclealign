import { useSettings } from '@/lib/stores/useSettings';
import { useSubscription } from '@/lib/stores/useSubscription';

/**
 * V2 features are Premium-only. The device flag alone must not unlock them —
 * a lapsed subscription (or a stale persisted flag) falls back to V1.
 */
export function useIsV2(): boolean {
  const v2Selected = useSettings((s) => s.appVersion) === 'v2';
  const premium = useSubscription((s) => s.isPremium());
  return v2Selected && premium;
}

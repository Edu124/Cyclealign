import { pullState } from '@/lib/sync';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useSubscription } from '@/lib/stores/useSubscription';

/**
 * After a successful sign-in, restore the account from the cloud.
 * Returns true when a profile exists (returning user → straight to the app),
 * false when there's none yet (new account → onboarding).
 */
export async function restoreFromCloud(): Promise<boolean> {
  const { profile, cycleLogs, dailyLogs, subscriptionTier } = await pullState();
  if (!profile) return false;

  const app = useAppStore.getState();
  app.setProfile(profile);
  cycleLogs.forEach((l) => app.addCycleLog(l));
  app.completeOnboarding();

  const setLog = useDailyLog.getState().setLog;
  Object.values(dailyLogs).forEach((l) => setLog(l));

  if (subscriptionTier === 'premium') {
    useSubscription.getState().activate('monthly', null, null);
  }
  return true;
}

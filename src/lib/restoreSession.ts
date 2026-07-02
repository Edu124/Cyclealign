import { pullState, pushCycleLog, pushProfile } from '@/lib/sync';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useSubscription } from '@/lib/stores/useSubscription';
import type { Profile } from '@/types/models';

/**
 * A cloud profile is only "real" when onboarding data reached it. The signup
 * DB trigger creates a bare row (name only), which must not count — otherwise
 * a returning user restores an empty shell and lands on a blank dashboard.
 */
export function isCompleteProfile(profile: Profile | null): profile is Profile {
  return !!profile && !!profile.avgCycleLength;
}

/**
 * After a successful sign-in, reconcile local and cloud state:
 *  - complete profile in the cloud  → restore it here (returning user)
 *  - cloud empty but THIS device holds a completed onboarding → upload it
 *    (heals the email-confirmation flow, where onboarding finished before
 *    a session existed and the original upload was silently skipped)
 *  - neither → new account, caller routes to onboarding
 * Returns true when the user can go straight to the app.
 */
export async function restoreFromCloud(): Promise<boolean> {
  const { profile, cycleLogs, dailyLogs, subscriptionTier } = await pullState();
  const app = useAppStore.getState();

  if (!isCompleteProfile(profile)) {
    const local = app.profile;
    if (isCompleteProfile(local)) {
      await pushProfile(local).catch(() => {});
      for (const log of app.cycleLogs) {
        await pushCycleLog(log).catch(() => {});
      }
      app.completeOnboarding();
      return true;
    }
    return false;
  }

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

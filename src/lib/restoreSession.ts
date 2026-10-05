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

  // Answers that only exist on this device (the cloud columns may not exist yet) must survive a restore.
  const localProfile = app.profile;
  const keep = localProfile && localProfile.id === profile.id ? localProfile : null;
  app.setProfile({
    ...profile,
    cycleRegularity: profile.cycleRegularity ?? keep?.cycleRegularity,
    healthContext: profile.healthContext ?? keep?.healthContext,
    cycleLengthRange: profile.cycleLengthRange ?? keep?.cycleLengthRange,
  });
  cycleLogs.forEach((l) => app.addCycleLog(l));
  app.completeOnboarding();

  const setLog = useDailyLog.getState().setLog;
  const localLogs = useDailyLog.getState().logs;
  Object.values(dailyLogs).forEach((l) => {
    const { focus, decisionConfidence, sleepQuality, sleepHours, stress, symptoms, bleeding } = localLogs[l.dateISO] ?? {};
    setLog({
      focus, decisionConfidence, sleepQuality, sleepHours, stress, symptoms, bleeding,
      ...l, // anything the cloud has wins; local-only extras fill the gaps
    });
  });

  if (subscriptionTier === 'premium') {
    useSubscription.getState().activate('monthly', null, null);
  }
  return true;
}

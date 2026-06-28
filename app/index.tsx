import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { SplashLogo } from '@/components/logo/SplashLogo';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useSession } from '@/lib/stores/useSession';

/**
 * Launch gate. Plays the animated logo intro, then routes:
 *   - signed in / demo mode AND onboarded -> the main tabs
 *   - otherwise -> the Welcome splash (which offers Get started / Log in)
 */
export default function Launch() {
  const [introDone, setIntroDone] = useState(false);
  const hydrated = useAppStore((s) => s.hydrated);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const { session, loading, demoMode } = useSession();

  // Safety net: never get stuck on the splash if something stalls.
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const ready = introDone && hydrated && !loading;
  if (!ready) {
    return <SplashLogo onFinish={() => setIntroDone(true)} />;
  }

  const signedIn = demoMode || !!session;
  if (signedIn && onboardingComplete) return <Redirect href="/(tabs)/today" />;
  return <Redirect href="/onboarding/welcome" />;
}

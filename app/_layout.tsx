import { Component, useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Updates from 'expo-updates';
import { supabase } from '@/lib/supabase';

// Required for expo-auth-session OAuth redirects to complete on web.
WebBrowser.maybeCompleteAuthSession();
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { palette } from '@/theme';
import { fontAssets } from '@/theme/fonts';
import { applyGlobalFont } from '@/theme/applyGlobalFont';
import { useSession } from '@/lib/stores/useSession';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useSubscription } from '@/lib/stores/useSubscription';
import { pullState, pushCycleLog, pushProfile } from '@/lib/sync';
import { isCompleteProfile } from '@/lib/restoreSession';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, color: '#C2683F', textAlign: 'center' }}>
            {'Something went wrong:\n'}{this.state.error}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * On web (desktop browser), constrain the app to a centred phone-width frame so
 * it previews like a real mobile screen instead of stretching full-width.
 * No-op on native.
 */
function useWebPhoneFrame() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'cyclealign-phone-frame';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `
      @media (min-width: 480px) {
        body { background: #DED8D0; }
        #root {
          max-width: 420px;
          width: 420px;
          margin: 0 auto;
          height: 100vh !important;
          overflow: hidden;
          box-shadow: 0 12px 48px rgba(47,42,37,0.22);
          border-radius: 0;
        }
      }`;
    document.head.appendChild(style);
  }, []);
}

function useCloudHydration() {
  const { session } = useSession();
  const setProfile = useAppStore((s) => s.setProfile);
  const addCycleLog = useAppStore((s) => s.addCycleLog);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setLog = useDailyLog((s) => s.setLog);
  const activateSubscription = useSubscription((s) => s.activate);
  const pulledRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = session?.user?.id ?? null;
    if (!uid) {
      // Signed out — allow a fresh pull when the same user signs back in.
      pulledRef.current = null;
      return;
    }
    if (pulledRef.current === uid) return;
    pulledRef.current = uid;

    pullState().then(({ profile, cycleLogs, dailyLogs, subscriptionTier }) => {
      if (isCompleteProfile(profile)) {
        setProfile(profile);
        // A complete cloud profile means onboarding finished on some device —
        // never send a returning user through onboarding again.
        completeOnboarding();
        cycleLogs.forEach((l) => addCycleLog(l));
      } else {
        // Cloud is empty (or only holds the signup trigger's bare row). If
        // THIS device has a completed onboarding, upload it now — this heals
        // the email-confirmation flow where the session arrives after
        // onboarding finished and the original upload was skipped.
        const local = useAppStore.getState();
        if (isCompleteProfile(local.profile)) {
          pushProfile(local.profile).catch(() => {});
          local.cycleLogs.forEach((l) => pushCycleLog(l).catch(() => {}));
        }
      }
      Object.values(dailyLogs).forEach((l) => setLog(l));
      if (subscriptionTier === 'premium') {
        activateSubscription('monthly', null, null);
      }
    }).catch(() => {});
  }, [session?.user?.id]);
}

/**
 * By default expo-updates only DOWNLOADS a new OTA update in the background
 * on launch — it never applies it until the NEXT cold start, which is why
 * users had to close and reopen the app (sometimes twice) to see a change.
 * This checks for an update before the UI is shown and, if one exists,
 * downloads it and reloads immediately, so opening the app is enough on its
 * own. Bounded by a timeout so a slow/flaky connection can never hang the
 * launch — worst case, it just falls through to whatever's already cached.
 */
function useEagerUpdateCheck(): boolean {
  const [checked, setChecked] = useState(Platform.OS === 'web' || !Updates.isEnabled);

  useEffect(() => {
    if (checked) return;
    let done = false;
    const finish = () => {
      if (!done) { done = true; setChecked(true); }
    };
    const timeout = setTimeout(finish, 8000);

    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          clearTimeout(timeout);
          await Updates.reloadAsync(); // restarts the app on the new bundle; nothing after this runs
          return;
        }
      } catch {
        // No network, dev client, transient error — proceed with what's cached.
      }
      clearTimeout(timeout);
      finish();
    })();

    return () => clearTimeout(timeout);
  }, []);

  return checked;
}

function useAuthDeepLink() {
  useEffect(() => {
    async function handleUrl(url: string) {
      // email confirmation: cyclealign://?code=xxx
      // oauth callback:     cyclealign://?code=xxx
      if (!url.includes('code=')) return;
      // Google OAuth redirects (…:/oauthredirect?code=…) carry a GOOGLE
      // authorization code that expo-auth-session exchanges itself — feeding
      // it to Supabase's exchange would fail and interfere. Only handle
      // Supabase's own links (email confirmation / browser OAuth callback).
      if (url.includes('oauthredirect')) return;
      try {
        // Linking.parse, not new URL(...).searchParams — Hermes does not
        // implement searchParams, so that throws on-device.
        const { queryParams } = Linking.parse(url);
        const code = typeof queryParams?.code === 'string' ? queryParams.code : null;
        if (code) await supabase.auth.exchangeCodeForSession(code);
      } catch {}
    }

    // App opened from cold via deep link
    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    // App already open and receives a deep link
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const updateChecked = useEagerUpdateCheck();
  useWebPhoneFrame();
  useCloudHydration();
  useAuthDeepLink();

  useEffect(() => {
    if ((fontsLoaded || fontError) && updateChecked) {
      // Apply Gabriola as the global text default, then reveal the app.
      applyGlobalFont();
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, updateChecked]);

  // Hold rendering until fonts are ready AND the update check has settled
  // (found-and-reloading, or none found, or timed out). Show a blank-coloured
  // view (not null) so the screen is never pure white while loading.
  if ((!fontsLoaded && !fontError) || !updateChecked) {
    return <View style={{ flex: 1, backgroundColor: '#F7F4EF' }} />;
  }

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="task-sync"         options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="log-history"       options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="privacy-settings" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="terms"             options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="paywall"           options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="founder-letter"    options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="exit-preview"      options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="blog/[id]"         options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ai-coach"          options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="flash-sale"        options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

import { Component, useEffect, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
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
import { pullState } from '@/lib/sync';

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
      if (profile) {
        setProfile(profile);
        // A cloud profile means onboarding was completed on some device —
        // never send a returning user through onboarding again.
        completeOnboarding();
      }
      cycleLogs.forEach((l) => addCycleLog(l));
      Object.values(dailyLogs).forEach((l) => setLog(l));
      if (subscriptionTier === 'premium') {
        activateSubscription('monthly', null, null);
      }
    }).catch(() => {});
  }, [session?.user?.id]);
}

function useAuthDeepLink() {
  useEffect(() => {
    async function handleUrl(url: string) {
      // email confirmation: cyclealign://?code=xxx
      // oauth callback:     cyclealign://?code=xxx
      if (!url.includes('code=')) return;
      try {
        const { searchParams } = new URL(url);
        const code = searchParams.get('code');
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
  useWebPhoneFrame();
  useCloudHydration();
  useAuthDeepLink();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Apply Gabriola as the global text default, then reveal the app.
      applyGlobalFont();
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Hold rendering until fonts are ready. Show a blank-coloured view (not null)
  // so the screen is never pure white while loading.
  if (!fontsLoaded && !fontError) {
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

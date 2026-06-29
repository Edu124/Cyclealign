import { Component, useEffect, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
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
  const setLog = useDailyLog((s) => s.setLog);
  const activateSubscription = useSubscription((s) => s.activate);
  const pulledRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = session?.user?.id ?? null;
    if (!uid || pulledRef.current === uid) return;
    pulledRef.current = uid;

    pullState().then(({ profile, cycleLogs, dailyLogs, subscriptionTier }) => {
      if (profile) setProfile(profile);
      cycleLogs.forEach((l) => addCycleLog(l));
      Object.values(dailyLogs).forEach((l) => setLog(l));
      if (subscriptionTier === 'premium') {
        activateSubscription('monthly', null, null);
      }
    }).catch(() => {});
  }, [session?.user?.id]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  useWebPhoneFrame();
  useCloudHydration();

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
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

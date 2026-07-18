import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TabScreen } from '@/components/ui';
import { MonthOutlook } from '@/components/plan/MonthOutlook';
import { RecommendedWindows } from '@/components/plan/RecommendedWindows';
import { PhaseTasksModal } from '@/components/plan/PhaseTasksModal';
import { CalendarConnectBanner } from '@/components/plan/CalendarConnectBanner';
import { DayEventsModal } from '@/components/plan/DayEventsModal';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useCalendar } from '@/lib/stores/useCalendar';
import { useIsV2 } from '@/lib/hooks/useIsV2';
import { fetchGoogleCalendarEvents, isGoogleCalendarConfigured } from '@/lib/googleCalendar';
import { fetchAppleCalendarEvents, isAppleCalendarSupported } from '@/lib/appleCalendar';
import { monthPlan } from '@/lib/intelligence/schedule';
import type { RecommendedWindow } from '@/lib/intelligence/schedule';
import { palette } from '@/theme';

// Required by expo-auth-session on web so the OAuth redirect completes.
WebBrowser.maybeCompleteAuthSession();

export default function Plan() {
  const profile    = useAppStore((s) => s.profile);
  const prediction = usePrediction();
  const {
    connected,
    providerLabel,
    events,
    connectGoogle,
    connectAppleCalendar,
    connectDemo,
    disconnect,
    eventsForDate,
  } = useCalendar();

  const isV2 = useIsV2();
  const [selectedWindow, setSelectedWindow] = useState<RecommendedWindow | null>(null);
  const [selectedDate, setSelectedDate]     = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // ── Google OAuth hook ─────────────────────────────────────────────────────
  // useAuthRequest THROWS at mount (crashing the whole screen) when the
  // client ID for the current platform is undefined. The placeholder keeps the
  // screen alive; promptGoogleAuth is only reachable behind
  // isGoogleCalendarConfigured(), which checks the real per-platform ID.
  const PLACEHOLDER_ID = 'unconfigured.apps.googleusercontent.com';
  const [, googleResponse, promptGoogleAuth] = Google.useAuthRequest({
    clientId:       process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? PLACEHOLDER_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? PLACEHOLDER_ID,
    iosClientId:    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? PLACEHOLDER_ID,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const token = googleResponse.authentication?.accessToken;
    if (!token) return;
    handleGoogleConnected(token);
  }, [googleResponse]);

  async function handleGoogleConnected(accessToken: string) {
    setCalendarLoading(true);
    try {
      const calEvents = await fetchGoogleCalendarEvents(accessToken);
      connectGoogle(accessToken, calEvents);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Sync failed', `Could not load your Google Calendar events.\n\n${msg}`);
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleAppleConnected() {
    setCalendarLoading(true);
    try {
      const calEvents = await fetchAppleCalendarEvents();
      connectAppleCalendar(calEvents);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Sync failed', `Could not load your Apple Calendar events.\n\n${msg}`);
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleConnect(providerId: string) {
    if (providerId === 'google') {
      if (!isGoogleCalendarConfigured()) {
        Alert.alert(
          'Google Calendar unavailable',
          isAppleCalendarSupported()
            ? 'Google Calendar sync is not available on this device yet. Connect Apple Calendar to use your real events, or preview with sample events.'
            : 'Google Calendar sync is not available on this device yet. You can preview with sample events instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use sample events', onPress: () => connectDemo('Google Calendar (demo)') },
          ],
        );
        return;
      }
      await promptGoogleAuth();
    } else if (providerId === 'apple' && isAppleCalendarSupported()) {
      await handleAppleConnected();
    } else {
      const labels: Record<string, string> = {
        apple:   'Apple Calendar (demo)',
        outlook: 'Outlook',
        demo:    'Sample Calendar',
      };
      connectDemo(labels[providerId] ?? 'Calendar');
    }
  }

  if (!profile || !prediction) {
    return (
      <TabScreen contentStyle={styles.empty}>
        <Text style={styles.emptyText}>Set up your cycle to plan your month.</Text>
      </TabScreen>
    );
  }

  const { recommendedWindows } = monthPlan(prediction);

  function handleDayPress(dateISO: string) {
    if (!connected) return;
    setSelectedDate(dateISO);
  }

  return (
    <>
      <TabScreen>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>Your plan</Text>
          <Text style={styles.subtitle}>
            Schedule your work with your hormones, not against them.
          </Text>
        </Animated.View>

        {isV2 && (
          <Animated.View entering={FadeInDown.delay(80).duration(500)}>
            <CalendarConnectBanner
              connected={connected}
              providerLabel={providerLabel}
              loading={calendarLoading}
              onConnect={handleConnect}
              onDisconnect={disconnect}
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <RecommendedWindows
            windows={recommendedWindows}
            onSelectWindow={setSelectedWindow}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
          <MonthOutlook
            prediction={prediction}
            events={isV2 && connected ? events : []}
            onDayPress={handleDayPress}
          />
        </Animated.View>
      </TabScreen>

      <PhaseTasksModal
        window={selectedWindow}
        role={profile.role}
        onClose={() => setSelectedWindow(null)}
      />

      <DayEventsModal
        dateISO={selectedDate}
        events={selectedDate ? eventsForDate(selectedDate) : []}
        prediction={prediction}
        onClose={() => setSelectedDate(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: palette.inkSoft, fontSize: 16, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: palette.ink },
  subtitle: { fontSize: 15, color: palette.inkSoft, marginTop: 4 },
});

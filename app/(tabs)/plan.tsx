import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
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
import { useCalendar, type CalendarEvent } from '@/lib/stores/useCalendar';
import { useTasks } from '@/lib/stores/useTasks';
import { TASK_SYNC_CATEGORIES } from '@/lib/intelligence/taskScore';
import { useIsV2 } from '@/lib/hooks/useIsV2';
import { fetchGoogleCalendarEvents, isGoogleCalendarConfigured, refreshGoogleAccessToken } from '@/lib/googleCalendar';
import { fetchOutlookCalendarEvents, isOutlookCalendarConfigured, refreshOutlookAccessToken } from '@/lib/outlookCalendar';
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
    connectOutlook,
    connectAppleCalendar,
    connectDemo,
    disconnect,
  } = useCalendar();

  // Planned tasks (Home → Plan a task) surface in the calendar automatically,
  // alongside any synced events — they share the same category taxonomy.
  const tasks = useTasks((s) => s.tasks);
  const taskEvents: CalendarEvent[] = tasks.map((t) => ({
    id: `task-${t.id}`,
    title:
      t.label?.trim() ||
      (TASK_SYNC_CATEGORIES.find((c) => c.id === t.category)?.label ?? 'Planned task'),
    categoryId: t.category,
    dateISO: t.dateISO,
    timeLabel: 'Planned',
    isPrivate: t.category === 'PERSONAL',
  }));
  const allEvents = [...events, ...taskEvents];

  // ── Auto re-sync ──────────────────────────────────────────────────────────
  // The connect flow takes a one-time snapshot; without this, events created
  // AFTER connecting never appear. Re-sync silently whenever the screen gains
  // focus or the app returns to the foreground (throttled to 30s), keeping the
  // existing snapshot when a refresh fails (e.g. expired Google token).
  const lastSyncRef = useRef(0);
  const refreshEvents = useCallback(() => {
    const now = Date.now();
    if (now - lastSyncRef.current < 30_000) return;
    const state = useCalendar.getState();
    if (!state.connected) return;
    if (state.providerLabel === 'Apple Calendar' && isAppleCalendarSupported()) {
      lastSyncRef.current = now;
      fetchAppleCalendarEvents()
        .then((evts) => useCalendar.getState().connectAppleCalendar(evts))
        .catch(() => {});
    } else if (state.providerLabel === 'Google Calendar' && state.googleAccessToken) {
      lastSyncRef.current = now;
      const token = state.googleAccessToken;
      fetchGoogleCalendarEvents(token)
        .then((evts) => useCalendar.getState().connectGoogle(token, evts))
        .catch(async () => {
          // The access token expires after ~1hr — this is the expected way
          // that first attempt fails, not an edge case. Mint a fresh one
          // from the refresh token and retry once before giving up.
          const refreshToken = useCalendar.getState().googleRefreshToken;
          if (!refreshToken) return;
          const freshToken = await refreshGoogleAccessToken(refreshToken);
          if (!freshToken) return;
          useCalendar.getState().updateGoogleAccessToken(freshToken);
          fetchGoogleCalendarEvents(freshToken)
            .then((evts) => useCalendar.getState().connectGoogle(freshToken, evts))
            .catch(() => {});
        });
    } else if (state.providerLabel === 'Outlook Calendar' && state.outlookAccessToken) {
      lastSyncRef.current = now;
      const token = state.outlookAccessToken;
      fetchOutlookCalendarEvents(token)
        .then((evts) => useCalendar.getState().connectOutlook(token, evts))
        .catch(async () => {
          // Access tokens expire in ~1hr, same expected pattern as Google —
          // mint a fresh one from the refresh token and retry once. Microsoft
          // also rotates the refresh token on every use, so the new one MUST
          // be stored or the next refresh fails with an already-used token.
          const refreshToken = useCalendar.getState().outlookRefreshToken;
          if (!refreshToken) return;
          const fresh = await refreshOutlookAccessToken(refreshToken);
          if (!fresh) return;
          fetchOutlookCalendarEvents(fresh.accessToken)
            .then((evts) => useCalendar.getState().connectOutlook(fresh.accessToken, evts, fresh.refreshToken))
            .catch(() => {});
        });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshEvents();
    }, [refreshEvents]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshEvents();
    });
    return () => sub.remove();
  }, [refreshEvents]);

  // Purge stale "(demo)" connections persisted by old app versions on iOS —
  // they masked the real connect flow (banner showed connected, so tapping
  // never asked permission) and kept showing sample events forever.
  useEffect(() => {
    const s = useCalendar.getState();
    if (Platform.OS === 'ios' && s.connected && s.providerLabel?.includes('(demo)')) {
      s.disconnect();
    }
  }, []);

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
    // access_type=offline is what makes Google issue a refresh token instead
    // of just a ~1hr access token; prompt=consent forces that even on a
    // reconnect (Google only auto-issues one on the very first-ever grant).
    // Without this, sync silently stops working an hour after connecting.
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const token = googleResponse.authentication?.accessToken;
    if (!token) return;
    handleGoogleConnected(token, googleResponse.authentication?.refreshToken ?? null);
  }, [googleResponse]);

  async function handleGoogleConnected(accessToken: string, refreshToken: string | null) {
    setCalendarLoading(true);
    try {
      const calEvents = await fetchGoogleCalendarEvents(accessToken);
      connectGoogle(accessToken, calEvents, refreshToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Sync failed', `Could not load your Google Calendar events.\n\n${msg}`);
    } finally {
      setCalendarLoading(false);
    }
  }

  // ── Outlook / Microsoft 365 OAuth ──────────────────────────────────────────
  // No prebuilt Microsoft provider exists in expo-auth-session the way there
  // is for Google, so this is built on the generic AuthSession primitives —
  // one client ID and one redirect URI cover every platform (Microsoft's
  // "public client" registration isn't tied to a per-platform bundle ID/SHA-1
  // the way Google's Android/iOS client types are).
  const OUTLOOK_DISCOVERY = {
    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  };
  const OUTLOOK_REDIRECT_URI = 'com.cyclealign.app://oauthredirect';
  const OUTLOOK_CLIENT_ID = process.env.EXPO_PUBLIC_OUTLOOK_CLIENT_ID ?? PLACEHOLDER_ID;

  const [outlookRequest, outlookResponse, promptOutlookAuth] = AuthSession.useAuthRequest(
    {
      clientId: OUTLOOK_CLIENT_ID,
      redirectUri: OUTLOOK_REDIRECT_URI,
      scopes: ['openid', 'profile', 'offline_access', 'https://graph.microsoft.com/Calendars.Read'],
      usePKCE: true,
      // Forces a fresh refresh token on every connect, same reasoning as
      // Google's prompt=consent above — otherwise a reconnect can silently
      // reuse a token Microsoft won't actually rotate for us.
      extraParams: { prompt: 'consent' },
    },
    OUTLOOK_DISCOVERY,
  );

  useEffect(() => {
    if (outlookResponse?.type !== 'success') return;
    const code = outlookResponse.params.code;
    const verifier = outlookRequest?.codeVerifier;
    if (!code || !verifier) return;
    (async () => {
      setCalendarLoading(true);
      try {
        const tokens = await AuthSession.exchangeCodeAsync(
          {
            clientId: OUTLOOK_CLIENT_ID,
            code,
            redirectUri: OUTLOOK_REDIRECT_URI,
            extraParams: { code_verifier: verifier },
          },
          OUTLOOK_DISCOVERY,
        );
        if (!tokens.accessToken) throw new Error('Microsoft did not return a token.');
        await handleOutlookConnected(tokens.accessToken, tokens.refreshToken ?? null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Sync failed', `Could not connect your Outlook Calendar.\n\n${msg}`);
        setCalendarLoading(false);
      }
    })();
  }, [outlookResponse]);

  async function handleOutlookConnected(accessToken: string, refreshToken: string | null) {
    try {
      const calEvents = await fetchOutlookCalendarEvents(accessToken);
      connectOutlook(accessToken, calEvents, refreshToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Sync failed', `Could not load your Outlook Calendar events.\n\n${msg}`);
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
    } else if (providerId === 'outlook') {
      if (!isOutlookCalendarConfigured()) {
        Alert.alert(
          'Outlook Calendar unavailable',
          'Outlook Calendar sync is not available on this device yet. You can preview with sample events instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use sample events', onPress: () => connectDemo('Outlook Calendar (demo)') },
          ],
        );
        return;
      }
      await promptOutlookAuth();
    } else {
      const labels: Record<string, string> = {
        apple: 'Apple Calendar (demo)',
        demo:  'Sample Calendar',
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
    if (!allEvents.some((e) => e.dateISO === dateISO)) return;
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
            events={isV2 ? (connected ? allEvents : taskEvents) : taskEvents}
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
        events={selectedDate ? allEvents.filter((e) => e.dateISO === selectedDate) : []}
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

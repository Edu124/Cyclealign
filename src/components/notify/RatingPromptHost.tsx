import { useEffect, useState } from 'react';
import { AppState, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useNotificationLedger } from '@/lib/stores/useNotificationLedger';
import { useFeatureFlags } from '@/lib/featureFlags';
import { isQuietNow } from '@/lib/notify/decide';
import { pickPopupItem } from '@/lib/notify/popup';
import { currentLibrary, recordEvents } from '@/lib/notify/service';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { openStoreReview, ratingBlockReason, storeName, useRatingPrompt } from '@/lib/rating';
import { todayISO } from '@/lib/dates';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';

const RECENT_MS = 30 * 60_000;

/**
 * The in-app "rate CycleAlign" pop-up. Shown rarely (see RATING_RULES), and
 * never on top of today's message pop-up, the period check-in or right after
 * she tapped a notification.
 */
export function RatingPromptHost() {
  const enabled = useFeatureFlags((s) => s.ratingPrompt);
  const profile = useAppStore((s) => s.profile);
  const onboarded = useAppStore((s) => s.onboardingComplete);
  const prediction = usePrediction();
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');

  const anim = useSharedValue(0);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: anim.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: anim.value, transform: [{ scale: 0.92 + 0.08 * anim.value }] }));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!active) return;
    const now = Date.now();
    useRatingPrompt.getState().touch(todayISO(), now);
    if (visible) return;

    // Wait a moment so today's message pop-up (if any) gets the screen first.
    const t = setTimeout(() => {
      const n = Date.now();
      const ledger = useNotificationLedger.getState();
      const cfg = currentLibrary().config;
      const recentPopup = ledger.events.some(
        (e) => e.channel === 'in_app' && (e.status === 'shown' || e.status === 'dismissed' || e.status === 'opened') && n - e.at < RECENT_MS,
      );
      const otherPromptRecently =
        recentPopup ||
        !!pickPopupItem(ledger.items, new Date(n), ledger.lastTapAt, cfg) ||
        (!!ledger.lastTapAt && n - ledger.lastTapAt < RECENT_MS) ||
        !!prediction?.isOverdue;
      const reason = ratingBlockReason(useRatingPrompt.getState(), {
        now: n,
        platform: Platform.OS,
        enabled,
        signedInAndOnboarded: !!profile && onboarded,
        checkIns: Object.keys(useDailyLog.getState().logs).length,
        otherPromptRecently,
        quietHours: isQuietNow(new Date(n), cfg),
      });
      if (reason) return;
      useRatingPrompt.getState().markShown(n);
      recordEvents([{ at: n, status: 'prompt_shown', type: 'rating_prompt', channel: 'in_app' }]);
      setVisible(true);
      anim.value = 0;
      anim.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    }, 4000);
    return () => clearTimeout(t);
  }, [active, enabled, profile?.id, onboarded]);

  function close() {
    anim.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setVisible)(false);
    });
  }

  async function rate() {
    useRatingPrompt.getState().markRated();
    close();
    const how = await openStoreReview();
    recordEvents([{ at: Date.now(), status: 'prompt_accepted', type: 'rating_prompt', channel: 'in_app', detail: how }]);
  }

  function later() {
    recordEvents([{ at: Date.now(), status: 'prompt_later', type: 'rating_prompt', channel: 'in_app' }]);
    close();
  }

  function never() {
    useRatingPrompt.getState().optOut();
    recordEvents([{ at: Date.now(), status: 'prompt_never', type: 'rating_prompt', channel: 'in_app' }]);
    close();
  }

  const store = storeName();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={later}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={later} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[styles.card, cardStyle]} accessibilityViewIsModal>
          <Text style={styles.stars} accessibilityElementsHidden importantForAccessibility="no">★★★★★</Text>
          <Text style={styles.title} accessibilityRole="header">Help other women find CycleAlign</Text>
          <Text style={styles.body}>
            If CycleAlign makes planning your days a little easier, a quick rating on {store} helps more women
            discover it. It only takes a few seconds.
          </Text>
          <Pressable style={styles.cta} onPress={rate} accessibilityRole="button">
            <Text style={styles.ctaText}>Rate on {store}</Text>
          </Pressable>
          <Pressable style={styles.later} onPress={later} accessibilityRole="button">
            <Text style={styles.laterText}>Maybe later</Text>
          </Pressable>
          <Pressable onPress={never} hitSlop={8} accessibilityRole="button">
            <Text style={styles.never}>Don't ask again</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.38)' },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: dash.card,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    gap: 10,
    alignItems: 'center',
    shadowColor: '#2E2A26',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  stars: { fontSize: 28, letterSpacing: 4, color: '#D9A23B' },
  title: { fontFamily: fonts.heading, fontSize: 22, color: dash.ink, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, color: dash.ink, textAlign: 'center' },
  cta: { alignSelf: 'stretch', backgroundColor: dash.sageDeep, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  later: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 8 },
  laterText: { color: dash.inkSoft, fontWeight: '600', fontSize: 14 },
  never: { fontSize: 12.5, color: dash.inkSoft, textDecorationLine: 'underline', paddingBottom: 4 },
});

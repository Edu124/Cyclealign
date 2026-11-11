import { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNotificationLedger } from '@/lib/stores/useNotificationLedger';
import { useNotificationPrefs } from '@/lib/stores/useNotificationPrefs';
import { revalidate, type PlannedItem } from '@/lib/notify/decide';
import { pickPopupItem } from '@/lib/notify/popup';
import { routeForLink } from '@/lib/notify/deepLinks';
import { currentLibrary, eventFor, recordEvents } from '@/lib/notify/service';
import { readPlanInput, usePendingNotificationRoute } from '@/lib/notify/useNotifications';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';

/** The in-app half of the notification system, mounted once inside the tabs. */
export function NotificationPopupHost() {
  usePendingNotificationRoute();
  const enabled = useNotificationPrefs((s) => s.enabled);
  const inApp = useNotificationPrefs((s) => s.inApp);
  const tick = useNotificationLedger((s) => s.popupTick);
  const notice = useNotificationLedger((s) => s.notice);
  const prediction = usePrediction();
  const [shown, setShown] = useState<PlannedItem | null>(null);
  const [active, setActive] = useState(AppState.currentState === 'active');

  const anim = useSharedValue(0);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: anim.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: anim.value,
    transform: [{ scale: 0.92 + 0.08 * anim.value }],
  }));

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // The overdue "has your period started?" check-in is already on screen that day.
  const otherModal = !!prediction?.isOverdue;

  useEffect(() => {
    if (!active || shown || enabled !== true || !inApp || otherModal) return;
    const t = setTimeout(() => {
      const ledger = useNotificationLedger.getState();
      const now = new Date();
      const item = pickPopupItem(ledger.items, now, ledger.lastTapAt, currentLibrary().config);
      if (!item) return;
      const input = readPlanInput(now);
      const fresh = input ? revalidate(item, input) : item;
      if (!fresh) return;
      ledger.patchItem(item.eventId, { ...fresh, status: 'shown' });
      recordEvents([eventFor(fresh, 'shown', 'in_app')]);
      setShown(fresh);
      anim.value = 0;
      anim.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    }, 1200);
    return () => clearTimeout(t);
  }, [active, tick, enabled, inApp, otherModal, shown]);

  function close(then?: () => void) {
    anim.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setShown)(null);
    });
    then?.();
  }

  function dismiss() {
    if (!shown) return;
    useNotificationLedger.getState().patchItem(shown.eventId, { status: 'dismissed' });
    recordEvents([eventFor(shown, 'dismissed', 'in_app')]);
    close();
  }

  function open() {
    if (!shown) return;
    const item = shown;
    useNotificationLedger.getState().patchItem(item.eventId, { status: 'opened' });
    recordEvents([eventFor(item, 'opened', 'in_app')]);
    const route = routeForLink(item.link, item.phase, !!readPlanInput()?.cycle.lastPeriodStart);
    close(() => {
      setTimeout(() => {
        try {
          router.push(route as never);
        } catch {
          recordEvents([eventFor(item, 'deep_link_failed', 'in_app')]);
        }
      }, 200);
    });
  }

  return (
    <>
      {notice ? (
        <Pressable
          style={styles.notice}
          onPress={() => useNotificationLedger.getState().set({ notice: null })}
          accessibilityRole="button"
          accessibilityLabel={`${notice} Tap to close.`}
        >
          <Text style={styles.noticeText}>{notice}</Text>
          <Text style={styles.noticeClose}>✕</Text>
        </Pressable>
      ) : null}

      <Modal visible={!!shown} transparent animationType="none" onRequestClose={dismiss}>
        <View style={styles.overlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Close" />
          </Animated.View>
          {shown && (
            <Animated.View style={[styles.card, cardStyle]} accessibilityViewIsModal>
              <View style={styles.header}>
                <Text style={styles.kicker}>For you today</Text>
                <Pressable onPress={dismiss} hitSlop={12} accessibilityLabel="Close">
                  <Text style={styles.close}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.title} accessibilityRole="header">{shown.title}</Text>
              <Text style={styles.body}>{shown.body}</Text>
              <Pressable style={styles.cta} onPress={open} accessibilityRole="button">
                <Text style={styles.ctaText}>{shown.cta}</Text>
              </Pressable>
              <Pressable style={styles.later} onPress={dismiss} accessibilityRole="button">
                <Text style={styles.laterText}>Not now</Text>
              </Pressable>
              <Text style={styles.footnote}>
                Based on your estimates and check-ins. Change these in Profile › Notifications.
              </Text>
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
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
    paddingTop: 18,
    paddingBottom: 16,
    gap: 10,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: dash.sageDeep, textTransform: 'uppercase' },
  close: { fontSize: 16, color: dash.inkSoft },
  title: { fontFamily: fonts.heading, fontSize: 22, color: dash.ink },
  body: { fontSize: 15, lineHeight: 22, color: dash.ink },
  cta: { backgroundColor: dash.sageDeep, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  later: { alignItems: 'center', paddingVertical: 8 },
  laterText: { color: dash.inkSoft, fontWeight: '600', fontSize: 14 },
  footnote: { fontSize: 11.5, lineHeight: 16, color: dash.inkSoft, textAlign: 'center' },
  notice: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: dash.ink,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 14,
  },
  noticeText: { flex: 1, color: '#FFFFFF', fontSize: 13, lineHeight: 18 },
  noticeClose: { color: '#FFFFFF', fontSize: 14 },
});

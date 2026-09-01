import { useEffect, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { useReferralPrompt } from '@/lib/stores/useReferralPrompt';
import { palette, radius, shadow, spacing } from '@/theme';

const MIN_GAP_MS = 3 * 24 * 60 * 60 * 1000; // 3 days — shared with the close-nudge notification
const SHOW_DELAY_MS = 2500; // let the Home screen settle in before asking

const REFERRAL_MESSAGE =
  "I've been using CycleAlign to work with my cycle instead of against it 🌙 " +
  'Join me — refer 3 friends and get a month free: https://cyclealign.app';

/**
 * iOS has no way to intercept the app-close gesture (unlike Android's back
 * button), so the referral pitch can't live at "exit" time the way
 * ExitFlowOverlay does. This shows the same pitch, in-app, a couple seconds
 * after opening — a guaranteed touchpoint that doesn't depend on the user
 * granting notification permission. Shares the same 3-day throttle as
 * ReferralCloseNudge so a session never gets both asks back to back.
 */
export function ReferralInAppCard() {
  const [visible, setVisible] = useState(false);
  const lastShownAt = useReferralPrompt((s) => s.lastShownAt);
  const markShown = useReferralPrompt((s) => s.markShown);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const due = !lastShownAt || Date.now() - new Date(lastShownAt).getTime() > MIN_GAP_MS;
    if (!due) return;

    const t = setTimeout(() => {
      markShown();
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setVisible(false);
  }

  async function handleRefer() {
    try {
      await Share.share({ message: REFERRAL_MESSAGE });
    } catch {}
    dismiss();
  }

  function handleTalkToFounder() {
    dismiss();
    router.push('/founder-letter');
  }

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={dismiss} />

      <Animated.View
        entering={FadeInUp.duration(300)}
        style={[styles.card, { bottom: insets.bottom + spacing.xl }]}
      >
        <Pressable onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>

        <View style={styles.iconCircle}>
          <Text style={styles.emoji}>🎁</Text>
        </View>
        <Text style={styles.title}>Loving CycleAlign?</Text>
        <Text style={styles.subtitle}>
          Refer 3 friends and get a month of CycleAlign free.
        </Text>

        <View style={styles.btnStack}>
          <Button label="Share with friends" onPress={handleRefer} style={styles.btn} />
          <Button
            label="Talk to the founder instead"
            variant="secondary"
            onPress={handleTalkToFounder}
            style={styles.btn}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47,42,37,0.45)',
  },
  card: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.soft,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 13, color: palette.muted, fontWeight: '700' },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: palette.lavender + '33',
  },
  emoji: { fontSize: 30 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: palette.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  btnStack: { width: '100%', gap: spacing.sm },
  btn: { width: '100%' },
});

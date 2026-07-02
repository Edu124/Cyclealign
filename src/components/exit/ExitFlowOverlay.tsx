import { useCallback, useState } from 'react';
import { BackHandler, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { palette, radius, shadow, spacing } from '@/theme';

type Stage = 'closed' | 'referral' | 'confirm';

const REFERRAL_MESSAGE =
  "I've been using CycleAlign to work with my cycle instead of against it 🌙 " +
  'Join me — refer 3 friends and get a month free: https://cyclealign.app';

interface Props {
  /** Preview/testing only — forces the overlay open at a given stage, bypassing the back-button trigger. */
  debugStage?: Stage;
}

/**
 * Android-only two-step exit flow, active only while the host screen is
 * focused. First back press shows a referral + founder pitch; a second back
 * press (or tapping "Exit app") shows a plain confirm-exit step.
 */
export function ExitFlowOverlay({ debugStage }: Props) {
  const [stage, setStage] = useState<Stage>(debugStage ?? 'closed');

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setStage((current) => {
          if (current === 'closed') return 'referral';
          if (current === 'referral') return 'confirm';
          return current; // 'confirm' stage: buttons decide, swallow extra presses
        });
        return true;
      });

      return () => {
        sub.remove();
        setStage('closed');
      };
    }, []),
  );

  function dismiss() {
    setStage('closed');
  }

  async function handleRefer() {
    try {
      await Share.share({ message: REFERRAL_MESSAGE });
    } catch {}
  }

  function handleTalkToFounder() {
    setStage('closed');
    router.push('/founder-letter');
  }

  function handleExitConfirm() {
    if (Platform.OS === 'android') BackHandler.exitApp();
  }

  if (stage === 'closed') return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={stage === 'referral' ? dismiss : undefined}
      />

      {stage === 'referral' && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.card}>
          <Pressable onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>

          <View style={[styles.iconCircle, styles.iconCircleReferral]}>
            <Text style={styles.emoji}>🎁</Text>
          </View>
          <Text style={styles.title}>Wait — before you go</Text>
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
      )}

      {stage === 'confirm' && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.card}>
          <View style={[styles.iconCircle, styles.iconCircleConfirm]}>
            <Text style={styles.emoji}>🌙</Text>
          </View>
          <Text style={styles.title}>Leaving already?</Text>
          <Text style={styles.subtitle}>
            Your cycle insights will be right here waiting when you're back.
          </Text>

          <View style={styles.btnRow}>
            <Button label="Stay" onPress={dismiss} style={styles.btnHalf} />
            <Button
              label="Exit app"
              variant="secondary"
              onPress={handleExitConfirm}
              style={styles.btnHalf}
            />
          </View>
        </Animated.View>
      )}
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
    bottom: spacing.xl,
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
  },
  iconCircleReferral: { backgroundColor: palette.lavender + '33' },
  iconCircleConfirm: { backgroundColor: palette.rose + '44' },
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
  btnRow: { flexDirection: 'row', width: '100%', gap: spacing.sm },
  btnHalf: { flex: 1 },
});

import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button, Screen } from '@/components/ui';
import { palette, radius, spacing } from '@/theme';

interface Props {
  step: number; // 1-based
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ctaLabel?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  loading?: boolean;
}

/** Shared onboarding step layout: animated progress bar + title + CTA. */
export function StepScaffold({
  step,
  total,
  title,
  subtitle,
  children,
  ctaLabel = 'Continue',
  onNext,
  nextDisabled,
  loading,
}: Props) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(step / total, { duration: 500 });
  }, [step, total, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn} activeOpacity={0.6}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      </View>
      <Text style={styles.stepText}>
        Step {step} of {total}
      </Text>

      <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(500)}
        style={styles.body}
      >
        {children}
      </Animated.View>

      <View style={styles.footer}>
        <Button
          label={ctaLabel}
          onPress={onNext}
          disabled={nextDisabled}
          loading={loading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, flexGrow: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.line,
  },
  backArrow: {
    fontSize: 22,
    color: palette.inkSoft,
    lineHeight: 26,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: palette.roseDeep,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.muted,
    letterSpacing: 1,
  },
  head: { gap: spacing.sm, marginTop: spacing.sm },
  title: { fontSize: 26, fontWeight: '800', color: palette.ink },
  subtitle: { fontSize: 15, lineHeight: 22, color: palette.inkSoft },
  body: { flex: 1, gap: spacing.lg, marginTop: spacing.md },
  footer: { marginTop: spacing.lg },
});

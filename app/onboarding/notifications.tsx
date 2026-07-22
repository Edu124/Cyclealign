import { PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { palette, radius, spacing } from '@/theme';

async function requestOSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if ((Platform.Version as number) < 33) return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export default function NotificationsStep() {
  const { notificationEnabled, set } = useOnboarding();

  async function handleEnable() {
    await requestOSPermission();
    set({ notificationEnabled: true });
    router.push('/onboarding/account');
  }

  function handleSkip() {
    set({ notificationEnabled: false });
    router.push('/onboarding/account');
  }

  return (
    <StepScaffold
      step={5}
      total={5}
      title="Your morning briefing"
      subtitle="CycleALIGN sends you one insight every morning — your phase update, energy level, and top focus for the day."
      ctaLabel="Turn on notifications"
      onNext={handleEnable}
    >
      {/* Bell illustration */}
      <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.illustrationWrap}>
        <View style={styles.bellCircle}>
          <Text style={styles.bellEmoji}>🔔</Text>
        </View>
        <View style={styles.bubbles}>
          <View style={[styles.bubble, styles.bubble1]}>
            <Text style={styles.bubbleText}>🌿 Follicular · Day 9</Text>
          </View>
          <View style={[styles.bubble, styles.bubble2]}>
            <Text style={styles.bubbleText}>High energy. Ideal for deep work.</Text>
          </View>
          <View style={[styles.bubble, styles.bubble3]}>
            <Text style={styles.bubbleText}>Top focus: Strategy & planning</Text>
          </View>
        </View>
      </Animated.View>

      {/* Feature list */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.features}>
        {[
          { icon: '⏰', text: 'Delivered every morning before you start your day' },
          { icon: '🌙', text: 'Aligned to your current phase — never generic advice' },
          { icon: '🔇', text: 'One notification per day, nothing else' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Skip link */}
      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.skipWrap}>
        <TouchableOpacity onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>Maybe later — I'll enable from settings</Text>
        </TouchableOpacity>
      </Animated.View>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  illustrationWrap: {
    alignItems: 'center',
    gap: 16,
  },
  bellCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FBE9F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellEmoji: { fontSize: 44 },
  bubbles: { gap: 8, width: '100%' },
  bubble: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: palette.line,
    alignSelf: 'flex-start',
  },
  bubble1: { alignSelf: 'flex-start' },
  bubble2: { alignSelf: 'center' },
  bubble3: { alignSelf: 'flex-end' },
  bubbleText: { fontSize: 13, fontWeight: '600', color: palette.ink },
  features: { gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  featureIcon: { fontSize: 18, marginTop: 1 },
  featureText: { flex: 1, fontSize: 14, lineHeight: 20, color: palette.inkSoft },
  skipWrap: { alignItems: 'center', marginTop: spacing.sm },
  skipText: { fontSize: 13, color: palette.muted, fontWeight: '600' },
});

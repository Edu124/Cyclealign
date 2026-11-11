import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { useNotificationPrefs } from '@/lib/stores/useNotificationPrefs';
import { recordEvents, requestPushPermission } from '@/lib/notify/service';
import { palette, radius, spacing } from '@/theme';

export default function NotificationsStep() {
  const { set } = useOnboarding();
  const setPrefs = useNotificationPrefs((s) => s.set);

  // Her choice is saved (it used to reset on every app restart). The OS
  // prompt only appears when she taps "Turn on".
  async function handleEnable() {
    await requestPushPermission();
    set({ notificationEnabled: true });
    setPrefs({ enabled: true });
    recordEvents([{ at: Date.now(), status: 'opt_in', type: 'daily_guidance', detail: 'onboarding' }]);
    router.push('/onboarding/account');
  }

  function handleSkip() {
    set({ notificationEnabled: false });
    setPrefs({ enabled: false });
    router.push('/onboarding/account');
  }

  return (
    <StepScaffold
      step={6}
      total={6}
      title="Your daily message"
      subtitle="One short, optional message a day, based on your estimated cycle and your check-ins, with one thing you can do."
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
            <Text style={styles.bubbleText}>🌿 Plan one small win</Text>
          </View>
          <View style={[styles.bubble, styles.bubble2]}>
            <Text style={styles.bubbleText}>Pick one task to focus on today.</Text>
          </View>
          <View style={[styles.bubble, styles.bubble3]}>
            <Text style={styles.bubbleText}>Adjust it to how you actually feel.</Text>
          </View>
        </View>
      </Animated.View>

      {/* Feature list */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.features}>
        {[
          { icon: '⏰', text: 'At 9 AM by default — change the time any time' },
          { icon: '🌙', text: 'Uses your estimated phase and what you log, never guesses' },
          { icon: '🔇', text: 'One a day, nothing between 9 PM and 8 AM' },
          { icon: '🔒', text: 'Neutral wording on your lock screen by default' },
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

import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Screen } from '@/components/ui';
import { Logo3D } from '@/components/logo/Logo3D';
import { palette, spacing } from '@/theme';

/**
 * Screen 1 — Welcome Splash. App logo + name, brand tagline, and two CTAs.
 * No data is collected here.
 */
export default function Welcome() {
  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <Animated.View entering={FadeIn.duration(700)}>
          <Logo3D size={210} showTagline />
        </Animated.View>
        <Animated.Text
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.tagline}
        >
          Hormone intelligence for women who lead
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(600)}
        style={styles.cta}
      >
        <Button label="Get started" onPress={() => router.push('/onboarding/role')} />
        <Button
          label="Log in"
          variant="secondary"
          onPress={() => router.push('/auth/sign-in')}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', paddingVertical: spacing.xxl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  tagline: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    color: palette.inkSoft,
    paddingHorizontal: spacing.lg,
  },
  cta: { gap: spacing.md },
});

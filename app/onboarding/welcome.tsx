import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Screen } from '@/components/ui';
import { Logo3D } from '@/components/logo/Logo3D';
import { useSettings } from '@/lib/stores/useSettings';
import { palette, spacing } from '@/theme';

/**
 * Screen 1 — Welcome Splash. App logo fades in, brand tagline, and two CTAs.
 * No data is collected here.
 */
export default function Welcome() {
  // Every fresh journey starts from here — first install, new account after a
  // signup at the end of onboarding, or a returning login. Settings are
  // device-local, so without this a previous user's v2 flag would carry over
  // into the new account.
  useEffect(() => {
    useSettings.getState().reset();
  }, []);

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.hero}>
        <Animated.View entering={FadeIn.duration(700)}>
          <Logo3D size={210} />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.taglineWrap}
        >
          <Text style={styles.taglineGreeting}>Dear ladies,</Text>
          <Text style={styles.taglineQuote}>"Work with your cycle. Not against it."</Text>
        </Animated.View>
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
  taglineWrap: { alignItems: 'center', gap: 6 },
  taglineGreeting: {
    fontSize: 13,
    color: palette.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  taglineQuote: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
    color: palette.ink,
    paddingHorizontal: spacing.lg,
  },
  cta: { gap: spacing.md },
});

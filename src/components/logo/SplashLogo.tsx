import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { spacing } from '@/theme';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Logo3D } from './Logo3D';

interface Props {
  /** Called once the entrance animation has finished playing. */
  onFinish?: () => void;
  size?: number;
}

/**
 * Full-screen launch experience: the 3D-style ring blooms in and breathes while
 * the wordmark rises beneath it. Calls `onFinish` after the intro completes so
 * the launch gate can route the user onward.
 */
export function SplashLogo({ onFinish, size = 220 }: Props) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.back(1.4)),
    });
    const t = setTimeout(() => onFinish?.(), 2200);
    return () => clearTimeout(t);
  }, [onFinish, opacity, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.root}>
      <GradientBackground />
      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <Logo3D size={size} />
        </Animated.View>
        <Animated.Text
          entering={FadeIn.delay(1100).duration(700)}
          style={styles.tagline}
        >
          In tune with your cycle
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  word: { marginTop: spacing.lg },
  tagline: {
    fontSize: 15,
    color: '#8E79D6',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

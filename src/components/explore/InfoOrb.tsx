import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme';
import { FeatureOrb } from './features';
import { OrbVisual } from './OrbVisual';

interface Props {
  orb: FeatureOrb;
  size?: number;
  /** Stagger the bob so a row of orbs floats out of sync. */
  index?: number;
  onPress: (orb: FeatureOrb) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A floating, tappable 3D orb. Bobs gently; pops + haptics on press. */
export function InfoOrb({ orb, size = 84, index = 0, onPress }: Props) {
  const bob = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    bob.value = withDelay(
      index * 220,
      withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [bob, index]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -8 * bob.value },
      { scale: press.value },
    ],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    press.value = withSequence(
      withTiming(0.88, { duration: 90 }),
      withTiming(1.06, { duration: 120 }),
      withTiming(1, { duration: 120 }),
    );
    onPress(orb);
  };

  return (
    <AnimatedPressable onPress={handlePress} style={[styles.wrap, style]}>
      <OrbVisual size={size} colors={orb.colors} emoji={orb.emoji} />
      <Text style={styles.label}>{orb.label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.inkSoft,
    marginTop: 2,
  },
});

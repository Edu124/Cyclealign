import { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface Props {
  value: number;
  duration?: number;
  style?: TextStyle | TextStyle[];
  /** Number of decimal places to display. */
  decimals?: number;
}

/** Counts up/down to `value` for a satisfying "tick" on data changes. */
export function AnimatedNumber({
  value,
  duration = 900,
  style,
  decimals = 0,
}: Props) {
  const progress = useSharedValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    progress.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, progress]);

  useAnimatedReaction(
    () => progress.value,
    (current) => {
      runOnJS(setDisplay)(current);
    },
  );

  return <Text style={style}>{display.toFixed(decimals)}</Text>;
}

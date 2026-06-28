import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  dayOfCycle: number;
  cycleLength: number;
  phaseLabel: string;
  phaseColor: string;
  size?: number;
}

/**
 * Big progress ring for Home: sweeps to the current day of the cycle with a
 * glowing gradient stroke, day number counting up in the centre.
 */
export function CycleRing({
  dayOfCycle,
  cycleLength,
  phaseLabel,
  phaseColor,
  size = 240,
}: Props) {
  const stroke = size * 0.07;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, dayOfCycle / cycleLength));

  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, sweep]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - sweep.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id="cycle" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.lavenderDeep} />
            <Stop offset="50%" stopColor={palette.roseDeep} />
            <Stop offset="100%" stopColor={palette.tealDeep} />
          </SvgLinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={palette.line}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress sweep — starts at top (rotated -90deg) */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={r}
          stroke="url(#cycle)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.label, { fontSize: size * 0.05 }]}>DAY</Text>
        <AnimatedNumber
          value={dayOfCycle}
          style={[styles.day, { fontSize: size * 0.27, lineHeight: size * 0.3 }]}
        />
        <Text style={[styles.of, { fontSize: size * 0.06 }]}>of {cycleLength}</Text>
        <View style={[styles.phasePill, { backgroundColor: `${phaseColor}26` }]}>
          <Text style={[styles.phaseText, { color: phaseColor }]}>
            {phaseLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: palette.muted,
  },
  day: {
    fontSize: 64,
    fontWeight: '800',
    color: palette.ink,
    lineHeight: 70,
  },
  of: {
    fontSize: 14,
    color: palette.inkSoft,
    marginTop: -4,
  },
  phasePill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  phaseText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

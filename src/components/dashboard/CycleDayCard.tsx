import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { Icon } from './Icon';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  dayOfCycle: number;
  phaseLabel: string;
  ovulationInDays: number;
  rangeLabel: string;
  progress: number; // 0..1
  onLogSymptoms?: () => void;
  onViewCalendar?: () => void;
}

function Ring({ progress }: { progress: number }) {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, sweep]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - sweep.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={r} stroke="#F0E2D6" strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={cx}
          cy={cx}
          r={r}
          stroke={dash.clay}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <View style={styles.ringCenter} pointerEvents="none">
        <Icon name="bloom" color={dash.clay} size={40} strokeWidth={1.6} />
      </View>
    </View>
  );
}

export function CycleDayCard({
  dayOfCycle,
  phaseLabel,
  ovulationInDays,
  rangeLabel,
  progress,
  onLogSymptoms,
  onViewCalendar,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.label}>Cycle Day</Text>
          <Text style={styles.day}>{dayOfCycle}</Text>
          <Text style={styles.phase}>{phaseLabel} Phase</Text>

          <View style={styles.ovRow}>
            <View style={styles.ovDot} />
            <Text style={styles.ovText}>
              {ovulationInDays <= 0
                ? 'Ovulation today'
                : `Ovulation in ${ovulationInDays} day${ovulationInDays === 1 ? '' : 's'}`}
            </Text>
          </View>

          <Pressable style={styles.button} onPress={onLogSymptoms}>
            <Text style={styles.buttonText}>Log Symptoms</Text>
          </Pressable>
        </View>

        <View style={styles.right}>
          <Ring progress={progress} />
          <Text style={styles.range}>{rangeLabel}</Text>
          <Pressable style={styles.calRow} onPress={onViewCalendar} hitSlop={6}>
            <Text style={styles.calText}>View Calendar</Text>
            <Icon name="chevronRight" color={dash.sage} size={14} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.cycleCard,
    borderRadius: 26,
    padding: 22,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  label: { fontSize: 15, color: dash.inkSoft },
  day: { fontFamily: fonts.headingBold, fontSize: 56, color: dash.clay, lineHeight: 62 },
  phase: { fontSize: 16, fontWeight: '600', color: dash.sage, marginTop: 2 },
  ovRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  ovDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: dash.clay },
  ovText: { fontSize: 14, color: dash.ink },
  button: {
    marginTop: 18,
    backgroundColor: dash.sage,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  right: { alignItems: 'center', gap: 8 },
  range: { fontSize: 13, color: dash.ink, fontWeight: '500', marginTop: 2 },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  calText: { fontSize: 14, color: dash.sage, fontWeight: '600' },
});

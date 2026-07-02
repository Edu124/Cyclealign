import { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { phaseColors } from '@/theme';
import type { PhaseKey } from '@/types/models';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  showTagline?: boolean;
  showName?: boolean;
  animate?: boolean;
}

const RING       = '#A8C293';
const STROKE_W   = 7;
const TOTAL_MS   = 1800;
const BASE_DELAY = 250; // let the screen fade in before sweeping

// Proportional phase durations from a 28-day reference cycle
const PHASE_DEFS: { key: PhaseKey; fraction: number }[] = [
  { key: 'menstrual',  fraction: 5  / 28 },
  { key: 'follicular', fraction: 8  / 28 },
  { key: 'ovulation',  fraction: 3  / 28 },
  { key: 'luteal',     fraction: 12 / 28 },
];

// ── Individual animated arc ───────────────────────────────────────────────────
// Driven by ONE shared `progress` value (0→1) so the whole ring sweeps as a
// single continuous curve — no per-segment easing restarts, no seams.

function PhaseArc({
  r, cx, cy,
  fraction, startFraction,
  color, progress,
}: {
  r: number; cx: number; cy: number;
  fraction: number; startFraction: number;
  color: string; progress: SharedValue<number>;
}) {
  const circ      = 2 * Math.PI * r;
  const phaseDash = circ * fraction;
  const endFraction = startFraction + fraction;
  // -90 = start at 12 o'clock; + offset puts this arc right after the previous one
  const rotation  = -90 + startFraction * 360;

  const animatedProps = useAnimatedProps(() => {
    const local = interpolate(
      progress.value,
      [startFraction, endFraction],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { strokeDashoffset: phaseDash * (1 - local) };
  });

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      stroke={color}
      strokeWidth={STROKE_W}
      fill="none"
      strokeDasharray={[phaseDash, circ - phaseDash]}
      rotation={rotation}
      originX={cx}
      originY={cy}
      strokeLinecap="butt"
      animatedProps={animatedProps}
    />
  );
}

// ── Logo component ────────────────────────────────────────────────────────────

export function Logo3D({ size = 240, animate = false }: Props) {
  const innerSize = size * 0.88;
  const svgR      = size / 2 - STROKE_W / 2;
  const center    = size / 2;

  const progress = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    progress.value = withDelay(
      BASE_DELAY,
      withTiming(1, { duration: TOTAL_MS, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [animate]);

  // Build arc descriptors — cumulative start positions along the 0→1 sweep
  let cumFraction = 0;
  const arcs = PHASE_DEFS.map(({ key, fraction }) => {
    const arc = {
      key,
      fraction,
      startFraction: cumFraction,
      color: phaseColors[key].base,
    };
    cumFraction += fraction;
    return arc;
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Cream outer shadow ring */}
      <View
        style={{
          position:      'absolute',
          width:         size,
          height:        size,
          borderRadius:  size / 2,
          backgroundColor: '#F7F4EF',
          shadowColor:   '#9C8C78',
          shadowOpacity: 0.15,
          shadowRadius:  size * 0.12,
          shadowOffset:  { width: 0, height: size * 0.03 },
          elevation:     4,
        }}
      />

      {/* Animated phase ring — SVG draws over the cream circle */}
      {animate && (
        <Svg
          width={size}
          height={size}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {arcs.map((arc) => (
            <PhaseArc
              key={arc.key}
              r={svgR}
              cx={center}
              cy={center}
              fraction={arc.fraction}
              startFraction={arc.startFraction}
              color={arc.color}
              progress={progress}
            />
          ))}
        </Svg>
      )}

      {/* Inner white circle with logo */}
      <View
        style={{
          width:        innerSize,
          height:       innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: '#FFFFFF',
          borderWidth:  1,
          borderColor:  RING + '44',
          alignItems:   'center',
          justifyContent: 'center',
          overflow:     'hidden',
        }}
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: innerSize * 0.9, height: innerSize * 0.9 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

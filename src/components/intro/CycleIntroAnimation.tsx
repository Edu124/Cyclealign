import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const WHEEL    = Math.min(W - 48, 300);
const RING1    = WHEEL + 32;
const RING2    = WHEEL + 60;

const PHASES = [
  {
    label: 'MENSTRUAL',
    days: 'Days 1–5',
    desc: 'Rest, reflect\nand recharge',
    color: '#E8748A',
    side: 'left' as const,
    vPos: H * 0.19,
  },
  {
    label: 'FOLLICULAR',
    days: 'Days 6–13',
    desc: 'Gain energy,\nfocus and clarity',
    color: '#8B7EC8',
    side: 'right' as const,
    vPos: H * 0.19,
  },
  {
    label: 'OVULATION',
    days: 'Days 14–15',
    desc: 'Peak energy &\nconfidence',
    color: '#F5A623',
    side: 'right' as const,
    vPos: H * 0.62,
  },
  {
    label: 'LUTEAL',
    days: 'Days 16–28',
    desc: 'Slow down &\nnourish',
    color: '#68C4B0',
    side: 'left' as const,
    vPos: H * 0.62,
  },
];

interface Props {
  onComplete: () => void;
}

export function CycleIntroAnimation({ onComplete }: Props) {
  const screenOpacity = useSharedValue(1);
  const screenScale   = useSharedValue(1);
  const ringsOpacity  = useSharedValue(1);
  const imgOpacity    = useSharedValue(0);
  const imgScale      = useSharedValue(0.82);
  const ring1Rot      = useSharedValue(0);
  const ring2Rot      = useSharedValue(0);

  const p0 = useSharedValue(0); const tx0 = useSharedValue(-40);
  const p1 = useSharedValue(0); const tx1 = useSharedValue(40);
  const p2 = useSharedValue(0); const tx2 = useSharedValue(40);
  const p3 = useSharedValue(0); const tx3 = useSharedValue(-40);

  const s0 = useAnimatedStyle(() => ({ opacity: p0.value, transform: [{ translateX: tx0.value }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: p1.value, transform: [{ translateX: tx1.value }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: p2.value, transform: [{ translateX: tx2.value }] }));
  const s3 = useAnimatedStyle(() => ({ opacity: p3.value, transform: [{ translateX: tx3.value }] }));
  const pillStyles = [s0, s1, s2, s3];
  const pillOp     = [p0, p1, p2, p3];
  const pillTx     = [tx0, tx1, tx2, tx3];

  const imgStyle    = useAnimatedStyle(() => ({
    opacity: imgOpacity.value,
    transform: [{ scale: imgScale.value }],
  }));
  const ring1Style  = useAnimatedStyle(() => ({
    opacity: ringsOpacity.value,
    transform: [{ rotate: `${ring1Rot.value}deg` }],
  }));
  const ring2Style  = useAnimatedStyle(() => ({
    opacity: ringsOpacity.value,
    transform: [{ rotate: `${ring2Rot.value}deg` }],
  }));
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));

  useEffect(() => {
    // Image (logo) fades in + scales
    imgOpacity.value = withTiming(1, { duration: 750 });
    imgScale.value   = withTiming(1, { duration: 950, easing: Easing.out(Easing.back(1.08)) });

    // Inner ring spins clockwise
    ring1Rot.value = withDelay(
      300,
      withRepeat(withTiming(360, { duration: 3200, easing: Easing.linear }), -1, false),
    );
    // Outer ring spins counter-clockwise (slower)
    ring2Rot.value = withDelay(
      300,
      withRepeat(withTiming(-360, { duration: 5000, easing: Easing.linear }), -1, false),
    );

    // Phase pills slide in staggered
    const DELAYS = [600, 1000, 1400, 1800];
    const EASE   = { duration: 480, easing: Easing.out(Easing.ease) };
    DELAYS.forEach((delay, i) => {
      pillOp[i].value = withDelay(delay, withTiming(1, EASE));
      pillTx[i].value = withDelay(delay, withTiming(0, EASE));
    });

    // Staged exit: pills fade → rings fade → screen blooms out
    // Step 1 (3 800ms): pills slide back out
    const exitEase = { easing: Easing.in(Easing.ease) };
    const exitTimer = setTimeout(() => {
      pillOp[0].value = withTiming(0, { duration: 300, ...exitEase });
      pillOp[1].value = withDelay(80,  withTiming(0, { duration: 300, ...exitEase }));
      pillOp[2].value = withDelay(160, withTiming(0, { duration: 300, ...exitEase }));
      pillOp[3].value = withDelay(240, withTiming(0, { duration: 300, ...exitEase }));
    }, 3800);

    // Step 2 (4 200ms): rings dissolve
    const ringsTimer = setTimeout(() => {
      ringsOpacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) });
    }, 4200);

    // Step 3 (4 500ms): whole screen fades + gently scales up (bloom)
    const timer = setTimeout(() => {
      screenOpacity.value = withTiming(0, { duration: 900, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onComplete)();
      });
      screenScale.value = withTiming(1.06, { duration: 900, easing: Easing.in(Easing.ease) });
    }, 4500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(ringsTimer);
      clearTimeout(timer);
    };
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, screenStyle]}>
      <View style={styles.bg} />

      {/* Outer ring — counter-clockwise, dashed-feel with gaps */}
      <Animated.View style={[styles.ring2, ring2Style]} />

      {/* Inner ring — clockwise, 4-phase colours */}
      <Animated.View style={[styles.ring1, ring1Style]} />

      {/* Center: logo + tagline */}
      <Animated.View style={[styles.centerWrap, imgStyle]}>
        <View style={styles.centerCircle}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Align with your cycle</Text>
        </View>
      </Animated.View>

      {/* Phase pills */}
      {PHASES.map((phase, i) => (
        <Animated.View
          key={phase.label}
          style={[
            styles.pillAbs,
            phase.side === 'left' ? styles.pillLeft : styles.pillRight,
            { top: phase.vPos },
            pillStyles[i],
          ]}
        >
          <View style={[styles.pill, { borderColor: phase.color + '55' }]}>
            <View style={[styles.dot, { backgroundColor: phase.color }]} />
            <View>
              <Text style={[styles.pillLabel, { color: phase.color }]}>{phase.label}</Text>
              <Text style={styles.pillDays}>{phase.days}</Text>
              <Text style={styles.pillDesc}>{phase.desc}</Text>
            </View>
          </View>
        </Animated.View>
      ))}

      <View style={styles.skipHint}>
        <Text style={styles.skipText}>tap anywhere to skip</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F7F4EF',
  },
  // 4-colour inner ring (clockwise)
  ring1: {
    position: 'absolute',
    width: RING1,
    height: RING1,
    borderRadius: RING1 / 2,
    borderWidth: 5,
    borderTopColor:    '#E8748A',
    borderRightColor:  '#8B7EC8',
    borderBottomColor: '#F5A623',
    borderLeftColor:   '#68C4B0',
  },
  // Subtle outer ring (counter-clockwise)
  ring2: {
    position: 'absolute',
    width: RING2,
    height: RING2,
    borderRadius: RING2 / 2,
    borderWidth: 2,
    borderTopColor:    '#E8748A44',
    borderRightColor:  '#8B7EC844',
    borderBottomColor: '#F5A62344',
    borderLeftColor:   '#68C4B044',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: WHEEL,
    height: WHEEL,
    borderRadius: WHEEL / 2,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logo: {
    width: WHEEL * 0.62,
    height: WHEEL * 0.62,
  },
  tagline: {
    fontSize: 12,
    color: '#A08C7E',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  pillAbs:   { position: 'absolute' },
  pillLeft:  { left: 10 },
  pillRight: { right: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    maxWidth: 140,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 3,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pillDays: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
  pillDesc: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    lineHeight: 14,
  },
  skipHint: {
    position: 'absolute',
    bottom: 40,
  },
  skipText: {
    fontSize: 12,
    color: '#BBA89A',
    letterSpacing: 0.4,
  },
});

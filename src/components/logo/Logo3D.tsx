import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  size?: number;
  animate?: boolean;
  /** Kept for API compatibility — the image already includes the wordmark. */
  showName?: boolean;
  showTagline?: boolean;
}

/**
 * CycleAlign brand logo — renders the actual logo PNG with an animated
 * gold-star sparkle overlay centred on the star in the artwork.
 */
export function Logo3D({ size = 240, animate = true }: Props) {
  const starAngle = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    starAngle.value = withRepeat(
      withTiming(360, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(starAngle);
  }, [animate, starAngle]);

  const starProps = useAnimatedProps(() => ({
    transform: `rotate(${starAngle.value} 50 50)`,
  }) as any);

  // The star in the artwork sits roughly at 58% across and 62% down.
  // We overlay a small SVG exactly on that spot.
  const starOverlaySize = size * 0.18;
  const starLeft = size * 0.54;
  const starTop  = size * 0.56;

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <Image
        source={require('../../../assets/logo.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />

      {/* Animated star glow overlay — sits on top of the logo star */}
      <View
        pointerEvents="none"
        style={[
          styles.starOverlay,
          { width: starOverlaySize, height: starOverlaySize, left: starLeft, top: starTop },
        ]}
      >
        <Svg width={starOverlaySize} height={starOverlaySize} viewBox="0 0 100 100">
          <AnimatedG animatedProps={starProps}>
            {/* 4-pointed star matching the logo's gold star */}
            <Path
              d="M50 20 L54 46 L80 50 L54 54 L50 80 L46 54 L20 50 L46 46 Z"
              fill="#C9A84C"
              opacity={0.55}
            />
            {/* sparkle arms */}
            <Circle cx={65} cy={30} r={3} fill="#C9A84C" opacity={0.35} />
            <Circle cx={30} cy={35} r={2.5} fill="#C9A84C" opacity={0.28} />
            <Circle cx={68} cy={68} r={2.5} fill="#C9A84C" opacity={0.28} />
          </AnimatedG>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  starOverlay: {
    position: 'absolute',
  },
});

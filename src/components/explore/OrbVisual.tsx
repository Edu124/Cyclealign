import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { OrbColors } from './features';

interface Props {
  size: number;
  colors: OrbColors;
  emoji?: string;
}

/**
 * A glossy, 3D-looking sphere drawn purely with SVG radial gradients:
 *  - an off-centre light->base->dark gradient gives volume,
 *  - a bright specular highlight near the top-left reads as a glass surface,
 *  - a soft contact shadow underneath grounds it.
 * Renders everywhere (no GL) and stays crisp at any size.
 */
export function OrbVisual({ size, colors, emoji }: Props) {
  const id = colors.base.replace('#', '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  return (
    <View style={{ width: size, height: size * 1.08 }}>
      <Svg width={size} height={size * 1.08}>
        <Defs>
          <RadialGradient id={`sphere-${id}`} cx="35%" cy="30%" r="75%">
            <Stop offset="0%" stopColor={colors.light} />
            <Stop offset="45%" stopColor={colors.base} />
            <Stop offset="100%" stopColor={colors.dark} />
          </RadialGradient>
          <RadialGradient id={`spec-${id}`} cx="35%" cy="26%" r="28%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`shadow-${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.dark} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={colors.dark} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Contact shadow */}
        <Ellipse
          cx={cx}
          cy={size * 1.0}
          rx={r * 0.8}
          ry={r * 0.18}
          fill={`url(#shadow-${id})`}
        />
        {/* Sphere body */}
        <Ellipse cx={cx} cy={cy} rx={r} ry={r} fill={`url(#sphere-${id})`} />
        {/* Specular highlight */}
        <Ellipse
          cx={cx - r * 0.28}
          cy={cy - r * 0.34}
          rx={r * 0.5}
          ry={r * 0.36}
          fill={`url(#spec-${id})`}
        />
      </Svg>

      {emoji ? (
        <View style={styles.emojiWrap} pointerEvents="none">
          <Text style={[styles.emoji, { fontSize: size * 0.34 }]}>{emoji}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  emojiWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '8%',
  },
  emoji: { textAlign: 'center' },
});

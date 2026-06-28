import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { gradients } from '@/theme';

interface Props {
  children?: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

/** Full-bleed soft pastel gradient used as the base of every screen. */
export function GradientBackground({ children, colors, style }: Props) {
  return (
    <LinearGradient
      colors={colors ?? gradients.screen}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
    >
      <View style={styles.fill}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

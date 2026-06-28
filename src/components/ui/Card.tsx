import { StyleSheet, View, ViewProps } from 'react-native';
import { palette, radius, shadow, spacing } from '@/theme';

interface Props extends ViewProps {
  glow?: boolean;
  padded?: boolean;
}

/** Rounded, soft-shadowed surface — the core container of the UI. */
export function Card({ glow, padded = true, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        glow ? shadow.glow : shadow.soft,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
  },
  padded: {
    padding: spacing.xl,
  },
});

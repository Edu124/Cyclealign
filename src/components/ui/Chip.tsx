import { StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '@/theme';

interface Props {
  label: string;
  color?: string;
  textColor?: string;
}

/** Small rounded pill — used for the current-phase indicator etc. */
export function Chip({ label, color = palette.lavender, textColor }: Props) {
  return (
    <View style={[styles.chip, { backgroundColor: `${color}26` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color: textColor ?? palette.ink }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});

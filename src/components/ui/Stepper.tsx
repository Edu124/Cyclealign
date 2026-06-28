import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, spacing } from '@/theme';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
}

export function Stepper({ label, value, onChange, min = 1, max = 99, unit, disabled }: Props) {
  const dec = () => { if (!disabled) onChange(Math.max(min, value - 1)); };
  const inc = () => { if (!disabled) onChange(Math.min(max, value + 1)); };

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <View style={styles.control}>
        <Pressable onPress={dec} style={[styles.btn, disabled && styles.btnDisabled]} hitSlop={8}>
          <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>−</Text>
        </Pressable>
        <Text style={[styles.value, disabled && styles.valueDisabled]}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Text>
        <Pressable onPress={inc} style={[styles.btn, disabled && styles.btnDisabled]} hitSlop={8}>
          <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowDisabled: { opacity: 0.45 },
  label: { fontSize: 15, fontWeight: '600', color: palette.ink, flex: 1 },
  labelDisabled: { color: palette.muted },
  control: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.line,
  },
  btnDisabled: { backgroundColor: palette.line },
  btnText: { fontSize: 22, fontWeight: '700', color: palette.lavenderDeep },
  btnTextDisabled: { color: palette.muted },
  value: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: palette.ink,
  },
  valueDisabled: { color: palette.muted },
});

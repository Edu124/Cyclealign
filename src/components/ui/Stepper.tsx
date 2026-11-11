import { useEffect, useRef } from 'react';
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

  // Press and hold to move quickly through a wide range (e.g. 15–90 days).
  const valueRef = useRef(value);
  valueRef.current = value;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  const hold = (step: 1 | -1) => {
    if (disabled) return;
    stop();
    timer.current = setInterval(() => {
      const next = Math.min(max, Math.max(min, valueRef.current + step));
      if (next === valueRef.current) return stop();
      valueRef.current = next;
      onChange(next);
    }, 90);
  };
  useEffect(() => stop, []);

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <View style={styles.control}>
        <Pressable
          onPress={dec}
          onLongPress={() => hold(-1)}
          onPressOut={stop}
          style={[styles.btn, disabled && styles.btnDisabled]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>−</Text>
        </Pressable>
        <Text style={[styles.value, disabled && styles.valueDisabled]}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Text>
        <Pressable
          onPress={inc}
          onLongPress={() => hold(1)}
          onPressOut={stop}
          style={[styles.btn, disabled && styles.btnDisabled]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
        >
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

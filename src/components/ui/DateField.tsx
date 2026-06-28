import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { palette, radius, spacing } from '@/theme';
import { fromISODate } from '@/lib/dates';
import { CalendarPicker } from './CalendarPicker';

interface Props {
  label?: string;
  value: string | null;
  onChange: (iso: string) => void;
  placeholder?: string;
  disableFuture?: boolean;
  minYear?: number;
  /** Birthdays open straight to the year list. */
  initialView?: 'days' | 'months' | 'years';
}

/**
 * A compact dropdown-style date field. Shows the selected date (or a
 * placeholder) and opens a small calendar popover on tap — no giant
 * always-on calendar taking over the screen.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  disableFuture,
  minYear,
  initialView = 'days',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? format(fromISODate(value), 'EEEE, d MMMM yyyy') : placeholder}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(140)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.popover}>
            <CalendarPicker
              value={value}
              disableFuture={disableFuture}
              minYear={minYear}
              initialView={value ? 'days' : initialView}
              onChange={(iso) => {
                onChange(iso);
                setOpen(false);
              }}
            />
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.inkSoft,
    marginLeft: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  triggerPressed: { borderColor: palette.lavender, backgroundColor: palette.surfaceAlt },
  value: { fontSize: 16, color: palette.ink, fontWeight: '600' },
  placeholder: { color: palette.muted, fontWeight: '400' },
  icon: { fontSize: 18 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(58,46,85,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  popover: { width: '100%', maxWidth: 360 },
});

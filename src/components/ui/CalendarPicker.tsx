import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isSameDay,
  startOfMonth,
} from 'date-fns';
import { palette, radius, spacing } from '@/theme';
import { fromISODate, toISODate } from '@/lib/dates';

type ViewMode = 'days' | 'months' | 'years';

interface Props {
  value: string | null;
  onChange: (iso: string) => void;
  /** Disallow dates after today (period start / birth date). */
  disableFuture?: boolean;
  /** Earliest selectable year (defaults to 120 years ago). */
  minYear?: number;
  /** Which sub-view to open first. Birthdays start at the year list. */
  initialView?: ViewMode;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Compact calendar with quick year→month→day navigation. Tapping the header
 * jumps to a scrollable year list (the way every birthday picker works), so
 * reaching a year decades ago is a couple of taps, not endless arrow presses.
 */
export function CalendarPicker({
  value,
  onChange,
  disableFuture,
  minYear,
  initialView = 'days',
}: Props) {
  const selected = value ? fromISODate(value) : null;
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(
    selected ?? startOfMonth(disableFuture ? today : new Date()),
  );
  const [view, setView] = useState<ViewMode>(initialView);

  const maxYear = today.getFullYear();
  const lowYear = minYear ?? maxYear - 120;
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= lowYear; y--) arr.push(y);
    return arr;
  }, [maxYear, lowYear]);

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const leading = getDay(first);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    return cells;
  }, [cursor]);

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        {view === 'days' ? (
          <>
            <Pressable onPress={() => setCursor(addMonths(cursor, -1))} hitSlop={12} style={styles.nav}>
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Pressable onPress={() => setView('years')} style={styles.headerTitle}>
              <Text style={styles.month}>{format(cursor, 'MMMM yyyy')}</Text>
              <Text style={styles.caret}>▾</Text>
            </Pressable>
            <Pressable onPress={() => setCursor(addMonths(cursor, 1))} hitSlop={12} style={styles.nav}>
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => setView('days')} style={styles.headerTitleCenter}>
            <Text style={styles.month}>
              {view === 'years' ? 'Select year' : `Select month · ${cursor.getFullYear()}`}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Years */}
      {view === 'years' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.grid3}>
            {years.map((y) => {
              const active = cursor.getFullYear() === y;
              return (
                <Pressable
                  key={y}
                  onPress={() => {
                    setCursor(new Date(y, cursor.getMonth(), 1));
                    setView('months');
                  }}
                  style={[styles.cell3, active && styles.cell3Active]}
                >
                  <Text style={[styles.cell3Text, active && styles.cell3TextActive]}>
                    {y}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Months */}
      {view === 'months' && (
        <View style={styles.grid3}>
          {MONTHS.map((m, i) => {
            const disabled =
              disableFuture &&
              (cursor.getFullYear() > maxYear ||
                (cursor.getFullYear() === maxYear && i > today.getMonth()));
            const active = cursor.getMonth() === i;
            return (
              <Pressable
                key={m}
                disabled={disabled}
                onPress={() => {
                  setCursor(new Date(cursor.getFullYear(), i, 1));
                  setView('days');
                }}
                style={[styles.cell3, active && styles.cell3Active]}
              >
                <Text
                  style={[
                    styles.cell3Text,
                    active && styles.cell3TextActive,
                    disabled && styles.disabledText,
                  ]}
                >
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Days */}
      {view === 'days' && (
        <>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.grid7}>
            {days.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={styles.cell7} />;
              const isSelected = selected && isSameDay(day, selected);
              const isToday = isSameDay(day, today);
              const disabled = disableFuture && isAfter(day, today);
              return (
                <Pressable
                  key={day.toISOString()}
                  disabled={disabled}
                  onPress={() => onChange(toISODate(day))}
                  style={styles.cell7}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isSelected && styles.daySelected,
                      !isSelected && isToday && styles.dayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        disabled && styles.disabledText,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    minHeight: 40,
  },
  nav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
  },
  navText: { fontSize: 22, color: palette.lavenderDeep, fontWeight: '700' },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  headerTitleCenter: { flex: 1, alignItems: 'center' },
  month: { fontSize: 16, fontWeight: '700', color: palette.ink },
  caret: { fontSize: 12, color: palette.lavenderDeep },
  scroll: { maxHeight: 240 },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: palette.muted,
    marginBottom: spacing.sm,
  },
  grid7: { flexDirection: 'row', flexWrap: 'wrap' },
  cell7: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: palette.roseDeep },
  dayToday: { borderWidth: 1.5, borderColor: palette.lavender },
  dayText: { fontSize: 15, color: palette.ink, fontWeight: '600' },
  dayTextSelected: { color: palette.white, fontWeight: '800' },
  disabledText: { color: palette.line },
  grid3: { flexDirection: 'row', flexWrap: 'wrap' },
  cell3: {
    width: `${100 / 3}%`,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell3Active: {},
  cell3Text: { fontSize: 16, color: palette.ink, fontWeight: '600' },
  cell3TextActive: {
    color: palette.roseDeep,
    fontWeight: '800',
    fontSize: 18,
  },
});

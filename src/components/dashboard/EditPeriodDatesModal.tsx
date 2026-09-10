import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { addMonths, endOfMonth, format, getDay, isAfter, isSameDay, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui';
import { fromISODate, toISODate } from '@/lib/dates';
import { palette, radius, shadow, spacing } from '@/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  visible: boolean;
  currentStartDate: string;
  currentEndDate: string | null;
  onClose: () => void;
  onSave: (startDate: string, endDate: string) => void;
}

/**
 * Lets her correct her period dates directly on a real calendar — tap a day
 * to mark when it started, tap a later day to mark when it ended. Every day
 * in between highlights as the period range.
 */
export function EditPeriodDatesModal({
  visible,
  currentStartDate,
  currentEndDate,
  onClose,
  onSave,
}: Props) {
  const [cursor, setCursor] = useState(() => startOfMonth(fromISODate(currentStartDate)));
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  // Re-seed the draft from the live value each time the modal opens.
  useEffect(() => {
    if (!visible) return;
    setRangeStart(currentStartDate);
    setRangeEnd(currentEndDate ?? currentStartDate);
    setCursor(startOfMonth(fromISODate(currentStartDate)));
  }, [visible, currentStartDate, currentEndDate]);

  const today = new Date();

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

  function handleDayPress(iso: string) {
    if (!rangeStart || rangeEnd) {
      // Nothing selected yet, or a full range is already set — start fresh.
      setRangeStart(iso);
      setRangeEnd(null);
    } else if (iso < rangeStart) {
      // Tapped an earlier day than the current start — it becomes the new start.
      setRangeStart(iso);
    } else {
      setRangeEnd(iso);
    }
  }

  function handleSave() {
    if (!rangeStart) return;
    onSave(rangeStart, rangeEnd ?? rangeStart);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Editing</Text>
          <Text style={styles.subtitle}>
            Tap a day to mark when your period started, then tap another day for when it ended.
          </Text>

          <View style={styles.calendar}>
            <View style={styles.header}>
              <Pressable onPress={() => setCursor(addMonths(cursor, -1))} hitSlop={12} style={styles.nav}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Text style={styles.month}>{format(cursor, 'MMMM yyyy')}</Text>
              <Pressable onPress={() => setCursor(addMonths(cursor, 1))} hitSlop={12} style={styles.nav}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <Text key={i} style={styles.weekday}>{w}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((day, idx) => {
                if (!day) return <View key={`e${idx}`} style={styles.cell} />;
                const iso = toISODate(day);
                const isStart = iso === rangeStart;
                const isEnd = rangeEnd ? iso === rangeEnd : isStart;
                const inRange = !!rangeStart && iso >= rangeStart && iso <= (rangeEnd ?? rangeStart);
                const isToday = isSameDay(day, today);
                const disabled = isAfter(day, today);

                return (
                  <Pressable
                    key={iso}
                    disabled={disabled}
                    onPress={() => handleDayPress(iso)}
                    style={styles.cell}
                  >
                    <View
                      style={[
                        styles.rangeFill,
                        inRange && !isStart && !isEnd && styles.rangeFillMid,
                        isStart && rangeEnd && styles.rangeFillStart,
                        isEnd && rangeStart !== rangeEnd && styles.rangeFillEnd,
                      ]}
                    >
                      <View
                        style={[
                          styles.dayInner,
                          (isStart || isEnd) && styles.daySelected,
                          !isStart && !isEnd && isToday && styles.dayToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            (isStart || isEnd) && styles.dayTextSelected,
                            disabled && styles.disabledText,
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn} hitSlop={8}>
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
            <Button label="Save" onPress={handleSave} disabled={!rangeStart} style={styles.saveBtn} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47,42,37,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.soft,
  },
  title: { fontSize: 18, fontWeight: '800', color: palette.ink },
  subtitle: { fontSize: 13, color: palette.inkSoft, lineHeight: 19 },

  calendar: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  nav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
  },
  navText: { fontSize: 20, color: palette.lavenderDeep, fontWeight: '700' },
  month: { fontSize: 15, fontWeight: '700', color: palette.ink },

  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeFill: {
    width: '100%',
    height: '78%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeFillMid: { backgroundColor: palette.roseDeep + '22' },
  rangeFillStart: { backgroundColor: palette.roseDeep + '22', borderTopLeftRadius: 19, borderBottomLeftRadius: 19 },
  rangeFillEnd: { backgroundColor: palette.roseDeep + '22', borderTopRightRadius: 19, borderBottomRightRadius: 19 },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: palette.roseDeep },
  dayToday: { borderWidth: 1.5, borderColor: palette.lavender },
  dayText: { fontSize: 14, color: palette.ink, fontWeight: '600' },
  dayTextSelected: { color: palette.white, fontWeight: '800' },
  disabledText: { color: palette.line },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  cancelText: { fontSize: 14, fontWeight: '700', color: palette.muted },
  saveBtn: { minWidth: 110 },
});

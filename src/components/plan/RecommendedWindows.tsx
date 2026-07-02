import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format } from 'date-fns';
import { phaseColors, palette, radius, spacing } from '@/theme';
import type { RecommendedWindow } from '@/lib/intelligence/schedule';
import type { PhaseKey } from '@/types/models';
import { fromISODate, daysBetween } from '@/lib/dates';

// Canonical phase names (client spec) — the ONLY phase-naming system shown to
// users. Activity phrases like "Pitch & present" describe work, never phases.
const PHASE_LABEL: Record<PhaseKey, string> = {
  menstrual:  'Menstrual',
  follicular: 'Follicular',
  ovulation:  'Ovulatory',
  luteal:     'Luteal',
};

interface Props {
  windows: RecommendedWindow[];
  onSelectWindow: (w: RecommendedWindow) => void;
}

function rangeLabel(start: string, end: string): string {
  const s = fromISODate(start);
  const e = fromISODate(end);
  const sameMonth = s.getMonth() === e.getMonth();
  return sameMonth
    ? `${format(s, 'd')}–${format(e, 'd MMM')}`
    : `${format(s, 'd MMM')} – ${format(e, 'd MMM')}`;
}

/** "Plan around your cycle" — the next best window for each kind of work. */
export function RecommendedWindows({ windows, onSelectWindow }: Props) {
  const today = new Date();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Plan around your cycle</Text>
      <Text style={styles.subtitle}>Tap a window to see suggested tasks for your role</Text>

      <View style={styles.list}>
        {windows.map((w) => {
          const color = phaseColors[w.phase].deep;
          const startsIn = daysBetween(today, fromISODate(w.start));
          const when =
            startsIn <= 0 ? 'Now' : startsIn === 1 ? 'Tomorrow' : `In ${startsIn} days`;
          return (
            <TouchableOpacity
              key={w.activity}
              style={styles.row}
              onPress={() => onSelectWindow(w)}
              activeOpacity={0.75}
            >
              <View style={[styles.bar, { backgroundColor: color }]} />
              <View style={styles.rowText}>
                <Text style={styles.activity}>{w.activity}</Text>
                <Text style={styles.theme}>{PHASE_LABEL[w.phase]} phase</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.dates, { color }]}>
                  {rangeLabel(w.start, w.end)}
                </Text>
                <Text style={styles.when}>{when}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { fontSize: 20, fontWeight: '700', color: palette.ink },
  subtitle: { fontSize: 13, color: palette.muted, marginBottom: spacing.sm },
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.lg,
  },
  bar: { width: 5, alignSelf: 'stretch', borderRadius: 3 },
  rowText: { flex: 1 },
  activity: { fontSize: 16, fontWeight: '700', color: palette.ink },
  theme: { fontSize: 13, color: palette.muted, marginTop: 1 },
  rowRight: { alignItems: 'flex-end' },
  dates: { fontSize: 15, fontWeight: '800' },
  when: { fontSize: 12, color: palette.muted, marginTop: 1 },
  chevron: { fontSize: 20, color: palette.muted, marginLeft: 2 },
});

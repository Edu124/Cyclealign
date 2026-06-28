import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { phaseColors, palette, radius, spacing } from '@/theme';
import { DayOutlook } from '@/lib/intelligence/schedule';

interface Props {
  days: DayOutlook[];
  onPressDay?: (day: DayOutlook) => void;
  onSeeAll?: () => void;
}

/** Horizontal 7-day leadership outlook: each day shows its phase theme. */
export function WeekStrip({ days, onPressDay, onSeeAll }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Your week ahead</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>See full plan ›</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {days.map((d) => {
          const color = phaseColors[d.phase].deep;
          return (
            <Pressable
              key={d.dateISO}
              onPress={() => onPressDay?.(d)}
              style={[
                styles.day,
                d.isToday && { borderColor: color, borderWidth: 2 },
              ]}
            >
              <Text style={[styles.weekday, d.isToday && { color }]}>
                {d.isToday ? 'Today' : d.weekday}
              </Text>
              <Text style={styles.dayNum}>{d.dayLabel}</Text>
              <View style={[styles.phaseDot, { backgroundColor: color }]} />
              <Text style={[styles.theme, { color }]} numberOfLines={1}>
                {d.theme}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '700', color: palette.ink },
  seeAll: { fontSize: 14, fontWeight: '700', color: palette.lavenderDeep },
  row: { gap: spacing.md, paddingVertical: spacing.xs },
  day: {
    width: 66,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  weekday: { fontSize: 12, fontWeight: '700', color: palette.muted },
  dayNum: { fontSize: 18, fontWeight: '800', color: palette.ink },
  phaseDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  theme: { fontSize: 11, fontWeight: '700' },
});

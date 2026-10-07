import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addMonths,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from 'date-fns';
import { phaseColors, palette, radius, spacing } from '@/theme';
import { phaseForDateFromPrediction } from '@/lib/intelligence/schedule';
import type { ScoreColor } from '@/lib/intelligence/taskScore';
import { toISODate, todayISO } from '@/lib/dates';
import type { CalendarEvent } from '@/lib/stores/useCalendar';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useAdaptive } from '@/lib/adaptive/useAdaptive';
import { evaluateReadiness } from '@/lib/adaptive/readiness';
import type { ReadinessLevel } from '@/lib/adaptive/types';

interface Props {
  events: CalendarEvent[];
  onDayPress: (dateISO: string) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const SCORE_DOT: Record<ScoreColor, string> = {
  green: '#56723F',
  amber: '#B07A2E',
  red:   '#C2683F',
};

function worstScore(scores: (ScoreColor | null)[]): ScoreColor | null {
  if (scores.includes('red'))   return 'red';
  if (scores.includes('amber')) return 'amber';
  if (scores.includes('green')) return 'green';
  return null;
}

const NEUTRAL_DOT = '#B8AFA4';

const TINT: Record<ReadinessLevel, string | null> = {
  STRONG: '#56723F40',
  GOOD: '#56723F26',
  NEUTRAL: '#B07A2E2A',
  PROTECT: '#C2683F33',
  INSUFFICIENT_DATA: null,
};

export function MonthOutlook({ events, onDayPress }: Props) {
  const today = new Date();
  const { scorer, mode, prediction, ctx, readinessFor } = useAdaptive();
  const logs = useDailyLog((s) => s.logs);
  const adaptive = mode !== 'regular' || !prediction;
  const todayStr = todayISO();

  /** Adaptive days: lived days use what she logged, upcoming days use her own pattern. */
  const tintFor = (iso: string): string | null => {
    if (iso < todayStr) {
      const log = logs[iso];
      if (!log) return null;
      return TINT[evaluateReadiness({ log, type: 'RECOVERY', mode: ctx.mode }).level];
    }
    return TINT[readinessFor('RECOVERY', iso).level];
  };
  const [cursor, setCursor] = useState(startOfMonth(today));

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const last  = endOfMonth(cursor);
    const leading = getDay(first);
    const arr: (Date | null)[] = [];
    for (let i = 0; i < leading; i++) arr.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    return arr;
  }, [cursor]);

  // Pre-compute event dot colour per date ISO
  const dotByDate = useMemo(() => {
    const map: Record<string, string> = {};
    events.forEach((e) => {
      const { score } = scorer.scoreFor(e.categoryId, e.dateISO, e.title);
      const existing = map[e.dateISO];
      const incoming = score;
      if (!incoming) {
        // Adaptive users with little history have no score yet — still show that something is planned.
        if (adaptive && !existing) map[e.dateISO] = NEUTRAL_DOT;
        return;
      }
      // a real score replaces the neutral placeholder
      if (existing === NEUTRAL_DOT) {
        map[e.dateISO] = SCORE_DOT[incoming];
        return;
      }
      // keep worst score colour
      if (!existing) {
        map[e.dateISO] = SCORE_DOT[incoming];
      } else if (incoming === 'red') {
        map[e.dateISO] = SCORE_DOT.red;
      } else if (incoming === 'amber' && map[e.dateISO] === SCORE_DOT.green) {
        map[e.dateISO] = SCORE_DOT.amber;
      }
    });
    return map;
  }, [events, scorer, adaptive]);

  return (
    <View style={styles.wrap}>
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
        {cells.map((day, idx) => {
          if (!day) return <View key={`e${idx}`} style={styles.cell} />;
          const iso    = toISODate(day);
          const phase  = adaptive || !prediction ? null : phaseForDateFromPrediction(prediction, iso);
          const color  = phase ? phaseColors[phase].base : null;
          const tint   = phase ? `${color}40` : tintFor(iso);
          const isToday = isSameDay(day, today);
          const dotColor = dotByDate[iso];

          return (
            <Pressable
              key={iso}
              style={styles.cell}
              onPress={() => onDayPress(iso)}
            >
              <View
                style={[
                  styles.dayInner,
                  { backgroundColor: tint ?? palette.surfaceAlt },
                  isToday && { borderWidth: 2, borderColor: phase ? phaseColors[phase].deep : palette.lavenderDeep },
                ]}
              >
                <Text style={[styles.dayText, isToday && styles.dayTextToday]}>
                  {day.getDate()}
                </Text>
                {dotColor ? (
                  <View style={[styles.eventDot, { backgroundColor: dotColor }]} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        {adaptive ? (
          [
            { color: '#56723F66', label: 'Strong / good' },
            { color: '#B07A2E55', label: 'Neutral' },
            { color: '#C2683F55', label: 'Protect / flex' },
            { color: palette.surfaceAlt, label: 'Still learning' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))
        ) : (['menstrual', 'follicular', 'ovulation', 'luteal'] as const).map((p) => (
          <View key={p} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: phaseColors[p].base }]} />
            <Text style={styles.legendText}>{p[0].toUpperCase() + p.slice(1)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.scoreLegend}>
        {([
          { color: SCORE_DOT.green, label: 'Great timing' },
          { color: SCORE_DOT.amber, label: 'Manageable' },
          { color: SCORE_DOT.red,   label: 'Tough window' },
        ] as const).map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
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
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
  month: { fontSize: 16, fontWeight: '700', color: palette.ink },
  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: palette.muted,
    marginBottom: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayInner: {
    width: '100%',
    height: '100%',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 13, color: palette.ink, fontWeight: '600' },
  dayTextToday: { fontWeight: '800' },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
    bottom: 3,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  scoreLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: palette.inkSoft, fontWeight: '600' },
});

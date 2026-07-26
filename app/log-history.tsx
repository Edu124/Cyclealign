import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import { MOODS_QUICK, useDailyLog, type DailyLog } from '@/lib/stores/useDailyLog';
import { toISODate } from '@/lib/dates';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';

type ViewMode = 'weekly' | 'monthly';

function moodEmoji(key: string): string {
  return MOODS_QUICK.find((m) => m.key === key)?.emoji ?? '·';
}

function DayRow({ date, log, isToday }: { date: Date; log?: DailyLog; isToday: boolean }) {
  return (
    <View style={[styles.dayRow, isToday && styles.dayRowToday]}>
      <View style={styles.dayDate}>
        <Text style={styles.dayName}>{format(date, 'EEE')}</Text>
        <Text style={styles.dayNum}>{format(date, 'd MMM')}</Text>
      </View>
      {log ? (
        <>
          <View style={styles.energyPips}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View key={n} style={[styles.pip, n <= log.energy && styles.pipActive]} />
            ))}
          </View>
          <Text style={styles.mood}>{moodEmoji(log.mood)}</Text>
          <Text style={styles.win} numberOfLines={1}>
            {log.win ? `“${log.win}”` : ''}
          </Text>
        </>
      ) : (
        <Text style={styles.noLog}>{isToday ? 'not logged yet' : '—'}</Text>
      )}
    </View>
  );
}

/** Full history of Quick Logs with weekly and monthly views. */
export default function LogHistory() {
  const logs = useDailyLog((s) => s.logs);
  const [mode, setMode] = useState<ViewMode>('weekly');
  // Offset in weeks/months back from the current period (0 = current).
  const [offset, setOffset] = useState(0);

  const today = new Date();
  const todayISO = toISODate(today);

  const { title, days } = useMemo(() => {
    if (mode === 'weekly') {
      const anchor = subDays(today, offset * 7);
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = endOfWeek(anchor, { weekStartsOn: 1 });
      return {
        title: `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`,
        days: eachDayOfInterval({ start, end }),
      };
    }
    const anchor = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    return {
      title: format(anchor, 'MMMM yyyy'),
      days: eachDayOfInterval({ start: startOfMonth(anchor), end: endOfMonth(anchor) }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, offset]);

  // Never show future days.
  const visibleDays = days.filter((d) => toISODate(d) <= todayISO).reverse();

  const stats = useMemo(() => {
    const logged = visibleDays
      .map((d) => logs[toISODate(d)])
      .filter((l): l is DailyLog => !!l);
    if (logged.length === 0) return null;
    const avgEnergy = logged.reduce((s, l) => s + l.energy, 0) / logged.length;
    const moodCounts: Record<string, number> = {};
    logged.forEach((l) => { moodCounts[l.mood] = (moodCounts[l.mood] ?? 0) + 1; });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      count: logged.length,
      avgEnergy: avgEnergy.toFixed(1),
      topMood: topMood ? moodEmoji(topMood) : '·',
    };
  }, [visibleDays, logs]);

  function switchMode(m: ViewMode) {
    setMode(m);
    setOffset(0);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Your Logs</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Weekly / Monthly toggle */}
      <View style={styles.toggleRow}>
        {(['weekly', 'monthly'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => switchMode(m)}
            style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
              {m === 'weekly' ? 'Weekly' : 'Monthly'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Period navigation */}
      <View style={styles.periodRow}>
        <Pressable onPress={() => setOffset((o) => o + 1)} hitSlop={10} style={styles.arrowBtn}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.periodTitle}>{title}</Text>
        <Pressable
          onPress={() => setOffset((o) => Math.max(0, o - 1))}
          hitSlop={10}
          style={[styles.arrowBtn, offset === 0 && styles.arrowDisabled]}
          disabled={offset === 0}
        >
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      {/* Summary */}
      {stats && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats.count}</Text>
            <Text style={styles.statLabel}>days logged</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats.avgEnergy}</Text>
            <Text style={styles.statLabel}>avg energy</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats.topMood}</Text>
            <Text style={styles.statLabel}>top mood</Text>
          </View>
        </Animated.View>
      )}

      {/* Day list */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visibleDays.map((d) => {
          const iso = toISODate(d);
          return <DayRow key={iso} date={d} log={logs[iso]} isToday={iso === todayISO} />;
        })}
        {visibleDays.length === 0 && (
          <Text style={styles.empty}>Nothing here yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dash.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  back: { fontSize: 30, color: dash.inkSoft, lineHeight: 32 },
  headerTitle: { fontFamily: fonts.headingBold, fontSize: 19, color: dash.ink },

  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: dash.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dash.line,
    padding: 4,
    gap: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: dash.sage },
  toggleText: { fontSize: 14, fontWeight: '700', color: dash.inkSoft },
  toggleTextActive: { color: '#FFFFFF' },

  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: dash.card,
    borderWidth: 1,
    borderColor: dash.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.35 },
  arrow: { fontSize: 20, color: dash.ink, lineHeight: 22 },
  periodTitle: { fontFamily: fonts.heading, fontSize: 16, color: dash.ink },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12 },
  statChip: {
    flex: 1,
    backgroundColor: dash.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dash.line,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink },
  statLabel: { fontSize: 11, color: dash.muted },

  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dash.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dash.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayRowToday: { borderColor: dash.sage },
  dayDate: { width: 64 },
  dayName: { fontSize: 11, fontWeight: '700', color: dash.muted, textTransform: 'uppercase' },
  dayNum: { fontSize: 14, fontWeight: '700', color: dash.ink, marginTop: 1 },
  energyPips: { flexDirection: 'row', gap: 3 },
  pip: { width: 8, height: 8, borderRadius: 4, backgroundColor: dash.line },
  pipActive: { backgroundColor: dash.sage },
  mood: { fontSize: 18, width: 26, textAlign: 'center' },
  win: { flex: 1, fontSize: 12, color: dash.inkSoft, fontStyle: 'italic' },
  noLog: { flex: 1, fontSize: 13, color: dash.muted },
  empty: { textAlign: 'center', color: dash.muted, marginTop: 30 },
});

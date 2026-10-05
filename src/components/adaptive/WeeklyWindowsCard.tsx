import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { fromISODate } from '@/lib/dates';
import { useAdaptive } from '@/lib/adaptive/useAdaptive';
import { formatMinutes } from '@/lib/adaptive/windows';
import { LEVEL_LABEL } from '@/lib/adaptive/types';
import { OptimizeDayModal } from './OptimizeDayModal';

/** Smart Calendar header for adaptive users: this week's strongest decision windows + Optimize My Day. */
export function WeeklyWindowsCard() {
  const { rank } = useAdaptive();
  const [open, setOpen] = useState(false);
  const windows = rank('DECISION', 'Strategic decision', { days: 7 });

  return (
    <View style={styles.card} testID="weekly-windows">
      <Text style={styles.title}>Your strongest decision windows</Text>
      {windows.length === 0 ? (
        <Text style={styles.body}>
          We're still learning your pattern, so there's nothing to recommend yet. A few days of check-ins (energy, sleep, focus, confidence) and your best windows will appear here.
        </Text>
      ) : (
        windows.map((w) => (
          <View key={`${w.dateISO}-${w.startMin}`} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.when}>
                {format(fromISODate(w.dateISO), 'EEE, d MMM')} · {formatMinutes(w.startMin)}
              </Text>
              <Text style={styles.why}>{w.reasons.join(' · ')}</Text>
            </View>
            <Text style={styles.level}>{LEVEL_LABEL[w.readinessLevel]}</Text>
          </View>
        ))
      )}
      <Text style={styles.foot}>Recommendations come from your own check-ins and calendar — they are not medical predictions.</Text>
      <Pressable style={styles.cta} onPress={() => setOpen(true)} testID="optimize-from-plan">
        <Text style={styles.ctaText}>Optimize My Day</Text>
      </Pressable>
      <OptimizeDayModal visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: dash.card, borderRadius: 22, padding: 18, gap: 10, borderWidth: 1, borderColor: dash.line },
  title: { fontFamily: fonts.heading, fontSize: 17, color: dash.ink },
  body: { fontSize: 13.5, color: dash.inkSoft, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: dash.line },
  when: { fontSize: 14.5, fontWeight: '800', color: dash.ink },
  why: { fontSize: 12, color: dash.inkSoft, marginTop: 2, lineHeight: 17 },
  level: { fontSize: 12, fontWeight: '800', color: dash.sageDeep },
  foot: { fontSize: 11.5, color: dash.muted, lineHeight: 16 },
  cta: { backgroundColor: dash.sage, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});

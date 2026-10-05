import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useAdaptive } from '@/lib/adaptive/useAdaptive';
import { buildClinicianReport, REPORT_DISCLAIMER } from '@/lib/adaptive/safety';
import { PatternsCard } from './InsightCards';

/** Insights for people whose cycle isn't a reliable input: their own patterns, plus a record to take to a clinician. */
export function AdaptiveInsights() {
  const { patterns, todayISO, mode } = useAdaptive();
  const logs = useDailyLog((s) => s.logs);

  const share = async () => {
    try {
      await Share.share({ message: buildClinicianReport(Object.values(logs), todayISO) });
    } catch {}
  };

  return (
    <View style={{ gap: 16 }}>
      <View>
        <Text style={styles.title}>Your insights</Text>
        <Text style={styles.sub}>
          {mode === 'perimenopause'
            ? 'What your own check-ins show — sleep, energy, focus and symptoms as you report them.'
            : 'What your own check-ins show — the conditions where you tend to focus and decide best.'}
        </Text>
      </View>

      <PatternsCard />
      {patterns.stage === 'none' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Building your picture</Text>
          <Text style={styles.body}>
            Keep logging energy, sleep, focus and decision confidence. After about a month of check-ins we start spotting your own patterns — we never guess before then.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>A record for your clinician</Text>
        <Text style={styles.body}>
          Summarise the last 90 days of what you've logged — bleeding, symptoms, energy, sleep — to take to an appointment.
        </Text>
        <Pressable style={styles.btn} onPress={share} testID="share-report">
          <Text style={styles.btnText}>Share summary</Text>
        </Pressable>
        <Text style={styles.disclaimer}>{REPORT_DISCLAIMER}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.headingBold, fontSize: 26, color: dash.ink },
  sub: { fontSize: 14, color: dash.inkSoft, marginTop: 4, lineHeight: 20 },
  card: { backgroundColor: dash.card, borderRadius: 22, padding: 18, gap: 10, borderWidth: 1, borderColor: dash.line },
  cardTitle: { fontFamily: fonts.heading, fontSize: 17, color: dash.ink },
  body: { fontSize: 13.5, color: dash.inkSoft, lineHeight: 20 },
  btn: { backgroundColor: dash.sage, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  disclaimer: { fontSize: 11.5, color: dash.muted },
});

import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { addDaysISO } from '@/lib/dates';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useAdaptivePrefs } from '@/lib/stores/useAdaptivePrefs';
import { useDailyLog } from '@/lib/stores/useDailyLog';
import { useAdaptive } from '@/lib/adaptive/useAdaptive';
import { STAGE_COPY } from '@/lib/adaptive/patterns';
import {
  CLINICIAN_CTA,
  CLINICIAN_MESSAGE,
  buildClinicianReport,
} from '@/lib/adaptive/safety';

const PERSONALIZE = '/personalize' as Href;

/** Existing users: an optional, dismissible invitation — skipping changes nothing. */
export function PersonalizePromptCard() {
  const { hasProfileAnswers } = useAdaptive();
  const dismissed = useAdaptivePrefs((s) => s.personalizeDismissed);
  const dismiss = useAdaptivePrefs((s) => s.dismissPersonalize);
  if (hasProfileAnswers || dismissed) return null;

  return (
    <View style={styles.card} testID="personalize-prompt">
      <Text style={styles.title}>Personalize CycleAlign</Text>
      <Text style={styles.body}>
        Two quick questions help us shape recommendations around how your cycle actually behaves. Optional — nothing changes if you skip.
      </Text>
      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={() => router.push(PERSONALIZE)}>
          <Text style={styles.primaryText}>Personalize</Text>
        </Pressable>
        <Pressable onPress={dismiss} hitSlop={8}>
          <Text style={styles.ghost}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** A neutral nudge — never a diagnosis — when flagged symptoms keep being reported. */
export function ClinicianPromptCard() {
  const { clinicianPrompt, todayISO } = useAdaptive();
  const snoozedUntil = useAdaptivePrefs((s) => s.clinicianSnoozedUntil);
  const snooze = useAdaptivePrefs((s) => s.snoozeClinician);
  const logs = useDailyLog((s) => s.logs);

  if (!clinicianPrompt) return null;
  if (snoozedUntil && snoozedUntil > todayISO) return null;

  const share = async () => {
    try {
      await Share.share({ message: buildClinicianReport(Object.values(logs), todayISO) });
    } catch {}
  };

  return (
    <View style={[styles.card, styles.careCard]} testID="clinician-prompt">
      <Text style={styles.body}>{CLINICIAN_MESSAGE}</Text>
      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={share}>
          <Text style={styles.primaryText}>{CLINICIAN_CTA}</Text>
        </Pressable>
        <Pressable onPress={() => snooze(addDaysISO(todayISO, 7))} hitSlop={8}>
          <Text style={styles.ghost}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** What her own data shows, in her own terms. Quiet until there's enough of it. */
export function PatternsCard() {
  const { patterns } = useAdaptive();
  if (patterns.stage === 'none') return null;

  return (
    <View style={styles.card} testID="patterns-card">
      <Text style={styles.title}>Your patterns</Text>
      <Text style={styles.sub}>{STAGE_COPY[patterns.stage]}</Text>
      {patterns.insights.map((i) => (
        <Text key={i.id} style={styles.insight}>
          • {i.text}
        </Text>
      ))}
      {patterns.insights.length === 0 && (
        <Text style={styles.sub}>Nothing clear yet — a few more detailed check-ins will help.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: dash.card, borderRadius: 22, padding: 18, gap: 10, borderWidth: 1, borderColor: dash.line },
  careCard: { backgroundColor: '#FFF8EE', borderColor: '#FFE0B0' },
  title: { fontFamily: fonts.heading, fontSize: 17, color: dash.ink },
  sub: { fontSize: 13, color: dash.inkSoft, lineHeight: 19 },
  body: { fontSize: 14, color: dash.inkSoft, lineHeight: 20 },
  insight: { fontSize: 13.5, color: dash.ink, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 2 },
  primary: { backgroundColor: dash.sage, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 },
  ghost: { color: dash.muted, fontWeight: '700', fontSize: 14 },
});

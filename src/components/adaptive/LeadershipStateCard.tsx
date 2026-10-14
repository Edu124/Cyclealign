import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { capacityPhaseFor } from '@/lib/intelligence/capacity';
import { useAdaptive } from '@/lib/adaptive/useAdaptive';
import { formatMinutes } from '@/lib/adaptive/windows';
import { LEVEL_LABEL, type ReadinessLevel } from '@/lib/adaptive/types';

const CAPACITY_WORD: Record<ReadinessLevel, string> = {
  STRONG: 'High capacity',
  GOOD: 'Good capacity',
  NEUTRAL: 'Moderate capacity',
  PROTECT: 'Low capacity',
  INSUFFICIENT_DATA: 'Still learning',
};

const LEVEL_COLOR: Record<ReadinessLevel, string> = {
  STRONG: '#56723F',
  GOOD: '#6E8B5E',
  NEUTRAL: '#B07A2E',
  PROTECT: '#C2683F',
  INSUFFICIENT_DATA: dash.muted,
};

const PHASE_ESTIMATE: Record<string, string> = {
  menstrual: 'menstrual',
  follicular: 'follicular',
  ovulatory: 'around ovulation',
  luteal_early: 'early luteal',
  luteal_late: 'late luteal',
};

interface Props {
  onOptimize: () => void;
}

/**
 * The home screen's lead: what she can do with today, not which phase she's in.
 * Cycle phase appears only as small, clearly-estimated context for users whose
 * cycle is a reliable input.
 */
export function LeadershipStateCard({ onOptimize }: Props) {
  const { readinessFor, todayLog, opportunity, mode, prediction, reliability } = useAdaptive();
  const overall = readinessFor('RECOVERY');
  const decision = readinessFor('DECISION');
  const learning = overall.level === 'INSUFFICIENT_DATA';

  const stats: { label: string; value: string }[] = [];
  if (todayLog) {
    stats.push({ label: 'Energy', value: `${todayLog.energy}/5` });
    if (todayLog.sleepQuality !== undefined) stats.push({ label: 'Sleep', value: `${todayLog.sleepQuality}/5` });
    if (todayLog.focus !== undefined) stats.push({ label: 'Focus', value: `${todayLog.focus}/5` });
  }

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Your leadership state</Text>
      <Text style={[styles.capacity, { color: LEVEL_COLOR[overall.level] }]}>{CAPACITY_WORD[overall.level]}</Text>

      {learning ? (
        <Text style={styles.body}>
          We're still learning your personal decision pattern. For now, we'll use today's energy, sleep, focus and symptoms to structure your day — add a quick check-in below.
        </Text>
      ) : (
        <>
          {stats.length > 0 && (
            <View style={styles.stats}>
              {stats.map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}

          {opportunity && (
            <View style={styles.opportunity}>
              <Text style={styles.oppKicker}>Today's strongest opportunity</Text>
              <Text style={styles.oppText}>
                {formatMinutes(opportunity.startMin)}–{formatMinutes(opportunity.endMin)} · {opportunity.label}
              </Text>
            </View>
          )}

          <View style={styles.readinessRow}>
            <Text style={styles.readinessLabel}>Decision readiness</Text>
            <View style={[styles.chip, { backgroundColor: LEVEL_COLOR[decision.level] + '22' }]}>
              <Text style={[styles.chipText, { color: LEVEL_COLOR[decision.level] }]}>{LEVEL_LABEL[decision.level]}</Text>
            </View>
          </View>
          {decision.reasons.length > 0 && <Text style={styles.why}>{decision.reasons.slice(0, 2).join(' · ')}</Text>}
        </>
      )}

      {mode === 'regular' && prediction && reliability !== 'none' && (
        <Text style={styles.context}>
          Cycle context · {reliability === 'partial' ? 'roughly ' : ''}
          {PHASE_ESTIMATE[capacityPhaseFor(prediction)]} (estimated)
        </Text>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={onOptimize} testID="optimize-my-day">
          <Text style={styles.primaryText}>Optimize My Day</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push('/ai-coach')}>
          <Text style={styles.secondaryText}>Ask AI Align</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: dash.card, borderRadius: 22, padding: 20, gap: 10, borderWidth: 1, borderColor: dash.line },
  kicker: { fontSize: 12, fontWeight: '800', color: dash.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  capacity: { fontFamily: fonts.headingBold, fontSize: 28 },
  body: { fontSize: 14, color: dash.inkSoft, lineHeight: 21 },
  stats: { flexDirection: 'row', gap: 22, marginTop: 2 },
  stat: { alignItems: 'flex-start' },
  statValue: { fontSize: 18, fontWeight: '800', color: dash.ink },
  statLabel: { fontSize: 11.5, color: dash.muted, fontWeight: '600' },
  opportunity: { backgroundColor: dash.sageTint, borderRadius: 14, padding: 12, gap: 2 },
  oppKicker: { fontSize: 11.5, fontWeight: '700', color: dash.sageDeep },
  oppText: { fontSize: 15, fontWeight: '800', color: dash.ink },
  readinessRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  readinessLabel: { fontSize: 14, fontWeight: '700', color: dash.ink },
  chip: { borderRadius: 14, paddingVertical: 5, paddingHorizontal: 11 },
  chipText: { fontSize: 12.5, fontWeight: '800' },
  why: { fontSize: 12.5, color: dash.inkSoft, lineHeight: 18 },
  context: { fontSize: 12, color: dash.muted },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primary: { flex: 1, backgroundColor: dash.sage, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  secondary: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: dash.line },
  secondaryText: { color: dash.ink, fontWeight: '700', fontSize: 14 },
});

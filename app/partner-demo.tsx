import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { dash, phaseBanner } from '@/theme';
import { fonts } from '@/theme/fonts';
import { addDaysISO, fromISODate, todayISO } from '@/lib/dates';
import { PHASE_LABEL } from '@/lib/partnerSync';
import {
  CAPACITY_TO_PHASE_KEY,
  pickAdaptiveMessage,
  pickPartnerMessage,
  type CapacityPhase,
} from '../supabase/functions/_shared/partnerDigest';

/**
 * Developer preview of the partner's "Support someone" card with fake data, so
 * the message wording, the 2-day rotation and the adaptive (phase-free) mode can
 * be reviewed without two real accounts. Hidden in release builds.
 */

type Mode = 'regular' | 'adaptive';
type Tone = 'good' | 'tough' | 'unknown';

const PHASES: { id: CapacityPhase; label: string }[] = [
  { id: 'menstrual', label: 'Menstrual' },
  { id: 'follicular', label: 'Follicular' },
  { id: 'ovulatory', label: 'Ovulatory' },
  { id: 'luteal_early', label: 'Early luteal' },
  { id: 'luteal_late', label: 'Late luteal' },
];

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export default function PartnerDemo() {
  const [mode, setMode] = useState<Mode>('regular');
  const [phase, setPhase] = useState<CapacityPhase>('luteal_late');
  const [tone, setTone] = useState<Tone>('tough');
  const [offset, setOffset] = useState(0);

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.muted}>This preview is only available in development builds.</Text>
      </SafeAreaView>
    );
  }

  const dateISO = addDaysISO(todayISO(), offset);
  const regular = mode === 'regular';
  const toughDay = tone === 'tough';
  const message = regular
    ? pickPartnerMessage(phase, toughDay, dateISO)
    : pickAdaptiveMessage(tone, dateISO);
  const phaseKey = CAPACITY_TO_PHASE_KEY[phase];
  const banner = phaseBanner[phaseKey];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/today'))} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Partner preview</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.muted}>
          Fake data only. Change the options to see what her partner would read.
        </Text>

        <Text style={styles.label}>Her mode</Text>
        <View style={styles.row}>
          <Chip label="Regular cycle" on={regular} onPress={() => setMode('regular')} />
          <Chip label="Irregular / perimenopause" on={!regular} onPress={() => setMode('adaptive')} />
        </View>

        {regular && (
          <>
            <Text style={styles.label}>Her cycle phase</Text>
            <View style={styles.rowWrap}>
              {PHASES.map((p) => (
                <Chip key={p.id} label={p.label} on={phase === p.id} onPress={() => setPhase(p.id)} />
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>How she says she is today</Text>
        <View style={styles.row}>
          <Chip label="Doing well" on={tone === 'good'} onPress={() => setTone('good')} />
          <Chip label="Rough day" on={tone === 'tough'} onPress={() => setTone('tough')} />
          {!regular && <Chip label="No check-in" on={tone === 'unknown'} onPress={() => setTone('unknown')} />}
        </View>

        <Text style={styles.label}>Day (messages rotate every 2 days)</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepBtn} onPress={() => setOffset((o) => o - 1)}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.stepDate}>{format(fromISODate(dateISO), 'EEE, d MMM')}</Text>
            <Text style={styles.mutedSmall}>{offset === 0 ? 'today' : offset > 0 ? `+${offset} days` : `${offset} days`}</Text>
          </View>
          <Pressable style={styles.stepBtn} onPress={() => setOffset((o) => o + 1)}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        {/* What she can share */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Her sharing options</Text>
          {regular && <Text style={styles.toggle}>● Cycle phase</Text>}
          <Text style={styles.toggle}>● {regular ? 'Tougher-day heads-up' : "How I'm doing today"}</Text>
          <Text style={styles.toggle}>○ Energy &amp; mood detail</Text>
          {!regular && <Text style={styles.mutedSmall}>No cycle phase is ever shared for this mode.</Text>}
        </View>

        {/* What her partner sees */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support someone</Text>
          <View style={styles.digestHeader}>
            {regular ? (
              <View style={[styles.badge, { backgroundColor: banner.bg }]}>
                <Text style={[styles.badgeText, { color: banner.accent }]}>{PHASE_LABEL[phaseKey]}</Text>
              </View>
            ) : (
              <View />
            )}
            <Text style={styles.mutedSmall}>Updated just now</Text>
          </View>
          <View style={[styles.bubble, toughDay && styles.bubbleTough]}>
            {toughDay && <View style={styles.dot} />}
            <Text style={styles.bubbleText}>{message}</Text>
          </View>
          <Text style={styles.quick}>QUICK SUPPORT</Text>
          <View style={styles.row}>
            {['💛', '🤗', '🌸', '✨'].map((e) => (
              <View key={e} style={styles.react}>
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dash.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  back: { fontSize: 16, color: dash.ink, width: 50 },
  title: { fontFamily: fonts.heading, fontSize: 19, color: dash.ink },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  muted: { fontSize: 13.5, color: dash.inkSoft, lineHeight: 20, padding: 4 },
  mutedSmall: { fontSize: 12, color: dash.muted },
  label: { fontSize: 13, fontWeight: '800', color: dash.inkSoft, marginTop: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rowWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: dash.card, borderWidth: 1.5, borderColor: dash.line },
  chipOn: { backgroundColor: dash.sage, borderColor: dash.sage },
  chipText: { fontSize: 13, fontWeight: '600', color: dash.ink },
  chipTextOn: { color: '#FFFFFF' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: dash.card, borderRadius: 16, padding: 10, borderWidth: 1.5, borderColor: dash.line },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: dash.sageTint, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 24, fontWeight: '700', color: dash.sageDeep },
  stepDate: { fontSize: 16, fontWeight: '800', color: dash.ink },
  card: { backgroundColor: dash.card, borderRadius: 20, padding: 18, gap: 10, marginTop: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: dash.ink },
  toggle: { fontSize: 14, color: dash.ink },
  digestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  bubble: { backgroundColor: '#F9F6F1', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bubbleTough: { backgroundColor: '#FBEFE9' },
  bubbleText: { fontSize: 14, color: dash.ink, lineHeight: 20, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C2683F', marginTop: 6 },
  quick: { fontSize: 11, fontWeight: '700', color: dash.muted, letterSpacing: 0.4 },
  react: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F9F6F1', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: dash.line },
});

import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { DateField } from '@/components/ui';
import { Icon } from '@/components/dashboard/Icon';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useTasks } from '@/lib/stores/useTasks';
import {
  ScoreColor,
  TASK_SYNC_CATEGORIES,
  greenDates,
  scoreForDate,
} from '@/lib/intelligence/taskScore';
import { CapacityPhase, PHASE_CONTEXT } from '@/lib/intelligence/capacity';
import { fromISODate, todayISO } from '@/lib/dates';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';

const PHASE_NAME: Record<CapacityPhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal_early: 'early Luteal',
  luteal_late: 'late Luteal',
};

const SCORE_UI: Record<ScoreColor, { fg: string; bg: string; glyph: string; word: string }> = {
  green: { fg: '#56723F', bg: '#E8EFE1', glyph: '✓', word: 'Great timing' },
  amber: { fg: '#B07A2E', bg: '#F6E9D4', glyph: '!', word: 'Manageable' },
  red: { fg: '#C2683F', bg: '#F7E3D9', glyph: '⚑', word: 'Tough window' },
};

export default function TaskSync() {
  const prediction = usePrediction();
  const addTask = useTasks((s) => s.addTask);

  const [category, setCategory] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [label, setLabel] = useState('');
  const [result, setResult] = useState<{ phase: CapacityPhase; score: ScoreColor | null } | null>(
    null,
  );
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  if (!prediction) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => router.back()} title="Plan a task" />
        <Text style={styles.empty}>Set up your cycle first.</Text>
      </SafeAreaView>
    );
  }

  const check = () => {
    if (!category) return;
    setResult(scoreForDate(category, dateISO, prediction));
  };

  const save = () => {
    if (!category) return;
    addTask({ category, dateISO, label: label.trim() || undefined });
    router.back();
  };

  const dateLabel = format(fromISODate(dateISO), 'EEE, d MMM');

  // ---- Result view --------------------------------------------------------
  if (result) {
    const phaseName = PHASE_NAME[result.phase];
    const isPersonal = result.score === null;
    const ui = result.score ? SCORE_UI[result.score] : null;

    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => setResult(null)} title="Your timing" />
        <ScrollView contentContainerStyle={styles.content}>
          {isPersonal ? (
            <Animated.View entering={FadeInDown.duration(400)} style={[styles.resultCard, { backgroundColor: dash.cycleCard }]}>
              <View style={[styles.resultIcon, { backgroundColor: '#FFFFFF' }]}>
                <Icon name="lock" color={dash.clay} size={28} />
              </View>
              <Text style={styles.resultTitle}>Something important</Text>
              <Text style={styles.resultMsg}>
                You have something important on {dateLabel}. That's {phaseName} —{' '}
                {PHASE_CONTEXT[result.phase]}. Build buffer time around this.
              </Text>
              <Pressable style={[styles.cta, { backgroundColor: dash.sage }]} onPress={save}>
                <Text style={styles.ctaText}>Save task</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(400)} style={[styles.resultCard, { backgroundColor: ui!.bg }]}>
              <View style={[styles.resultIcon, { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.resultGlyph, { color: ui!.fg }]}>{ui!.glyph}</Text>
              </View>
              <Text style={[styles.resultTitle, { color: ui!.fg }]}>{ui!.word}</Text>
              <Text style={styles.resultMsg}>{message(result.score!, phaseName)}</Text>

              {result.score === 'green' && (
                <Pressable style={[styles.cta, { backgroundColor: ui!.fg }]} onPress={save}>
                  <Text style={styles.ctaText}>Save task</Text>
                </Pressable>
              )}
              {result.score === 'amber' && (
                <View style={styles.ctaRow}>
                  <Pressable style={[styles.cta, styles.ctaFlex, { backgroundColor: ui!.fg }]} onPress={save}>
                    <Text style={styles.ctaText}>Keep this date</Text>
                  </Pressable>
                  <Pressable style={[styles.cta, styles.ctaFlex, styles.ctaGhost]} onPress={() => setResult(null)}>
                    <Text style={[styles.ctaText, { color: dash.ink }]}>Find a better date</Text>
                  </Pressable>
                </View>
              )}
              {result.score === 'red' && (
                <View style={styles.ctaRow}>
                  <Pressable style={[styles.cta, styles.ctaFlex, { backgroundColor: ui!.fg }]} onPress={() => setRescheduleOpen(true)}>
                    <Text style={styles.ctaText}>Reschedule</Text>
                  </Pressable>
                  <Pressable style={[styles.cta, styles.ctaFlex, styles.ctaGhost]} onPress={save}>
                    <Text style={[styles.ctaText, { color: dash.ink }]}>Keep anyway</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        <RescheduleModal
          visible={rescheduleOpen}
          dates={category ? greenDates(category, prediction, 30) : []}
          onClose={() => setRescheduleOpen(false)}
          onPick={(iso) => {
            setRescheduleOpen(false);
            setDateISO(iso);
            setResult(scoreForDate(category!, iso, prediction));
          }}
        />
      </SafeAreaView>
    );
  }

  // ---- Input view ---------------------------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      <Header onBack={() => router.back()} title="Plan a task" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.privacy}>
          Pick a category only — your task stays private. We'll score it against your cycle.
        </Text>

        <Text style={styles.stepLabel}>What kind of task?</Text>
        <View style={styles.grid}>
          {TASK_SYNC_CATEGORIES.map((c) => {
            const active = category === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                style={[styles.catCard, active && styles.catCardActive]}
              >
                <View style={[styles.catIcon, active && { backgroundColor: dash.sage }]}>
                  <Icon name={c.icon} color={active ? '#FFFFFF' : dash.sage} size={22} />
                </View>
                <Text style={[styles.catLabel, active && { color: dash.sageDeep }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.stepLabel}>When are you planning it?</Text>
        <DateField value={dateISO} onChange={setDateISO} placeholder="Pick a date" />

        <Text style={styles.stepLabel}>Private label (optional)</Text>
        <TextInput
          placeholder="Add a private label (optional)"
          placeholderTextColor={dash.muted}
          value={label}
          onChangeText={(t) => setLabel(t.slice(0, 40))}
          maxLength={40}
          style={styles.input}
        />
        <Text style={styles.counter}>{label.length}/40 · stays on this device</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.cta, { backgroundColor: dash.sage }, !category && styles.ctaDisabled]}
          disabled={!category}
          onPress={check}
        >
          <Text style={styles.ctaText}>Check my timing</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function message(score: ScoreColor, phase: string): string {
  if (score === 'green')
    return `You'll be in your ${phase} phase — this is a strong window for this type of task.`;
  if (score === 'amber')
    return `Manageable, but not your peak window. You'll be in your ${phase} phase on this date.`;
  return `This is a high-effort task in a low-capacity window. You'll be in your ${phase} phase on this date. Want to reschedule?`;
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
        <Icon name="chevronLeft" color={dash.ink} size={24} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

function RescheduleModal({
  visible,
  dates,
  onClose,
  onPick,
}: {
  visible: boolean;
  dates: string[];
  onClose: () => void;
  onPick: (iso: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.sheet}>
          <Text style={styles.sheetTitle}>Better dates ahead</Text>
          <Text style={styles.sheetSub}>Green windows for this task in the next 30 days</Text>
          {dates.length === 0 ? (
            <Text style={styles.empty}>No green windows in the next 30 days.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.dateList}>
                {dates.map((d) => (
                  <Pressable key={d} style={styles.dateChip} onPress={() => onPick(d)}>
                    <Text style={styles.dateChipText}>
                      {format(fromISODate(d), 'EEEE, d MMM')}
                    </Text>
                    <Icon name="chevronRight" color={dash.sage} size={16} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dash.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.heading, fontSize: 20, color: dash.ink },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  empty: { fontSize: 15, color: dash.inkSoft, padding: 20 },
  privacy: { fontSize: 14, color: dash.inkSoft, lineHeight: 20 },
  stepLabel: { fontSize: 15, fontWeight: '700', color: dash.ink, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: dash.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: dash.line,
    padding: 14,
    gap: 8,
  },
  catCardActive: { borderColor: dash.sage, backgroundColor: dash.sageTint },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dash.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { fontSize: 14, fontWeight: '600', color: dash.ink },
  input: {
    backgroundColor: dash.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: dash.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: dash.ink,
  },
  counter: { fontSize: 12, color: dash.muted, textAlign: 'right' },
  footer: { padding: 20, paddingTop: 8 },
  cta: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaGhost: { backgroundColor: dash.card, borderWidth: 1.5, borderColor: dash.line },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  ctaRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  ctaFlex: { flex: 1 },
  resultCard: { borderRadius: 26, padding: 26, alignItems: 'center', gap: 12 },
  resultIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultGlyph: { fontSize: 34, fontWeight: '800' },
  resultTitle: { fontFamily: fonts.headingBold, fontSize: 24, color: dash.ink },
  resultMsg: { fontSize: 16, lineHeight: 24, color: dash.ink, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(46,42,37,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: dash.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    gap: 6,
  },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 20, color: dash.ink },
  sheetSub: { fontSize: 14, color: dash.inkSoft, marginBottom: 8 },
  dateList: { gap: 10 },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: dash.sageTint,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateChipText: { fontSize: 15, fontWeight: '600', color: dash.sageDeep },
});

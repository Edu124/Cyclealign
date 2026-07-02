import { useState } from 'react';
import {
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
import Animated, { FadeInDown } from 'react-native-reanimated';
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
              {result.score !== 'green' && (() => {
                // Any non-green day: recommend the next green windows for this
                // category so she can move the task with one tap.
                const betterDates = category ? greenDates(category, prediction, 30).slice(0, 3) : [];
                return (
                  <>
                    {betterDates.length > 0 && (
                      <View style={styles.betterDatesBox}>
                        <Text style={styles.betterDatesTitle}>
                          ✦ Better windows for this task — tap to move it
                        </Text>
                        <View style={styles.betterDatesList}>
                          {betterDates.map((d) => (
                            <Pressable
                              key={d}
                              style={styles.betterDateChip}
                              onPress={() => {
                                setDateISO(d);
                                setResult(scoreForDate(category!, d, prediction));
                              }}
                            >
                              <Text style={styles.betterDateText}>
                                {format(fromISODate(d), 'EEE, d MMM')}
                              </Text>
                              <Text style={styles.betterDateArrow}>→</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                    <Pressable
                      style={[
                        styles.cta,
                        result.score === 'amber' ? { backgroundColor: ui!.fg } : styles.ctaGhost,
                      ]}
                      onPress={save}
                    >
                      <Text style={[styles.ctaText, result.score === 'red' && { color: dash.ink }]}>
                        {result.score === 'amber' ? 'Keep this date' : 'Keep this date anyway'}
                      </Text>
                    </Pressable>
                  </>
                );
              })()}
            </Animated.View>
          )}
        </ScrollView>

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

        <Text style={styles.stepLabel}>Step 1 · What kind of task?</Text>
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

        <Text style={styles.stepLabel}>Step 2 · When are you planning it?</Text>
        <DateField value={dateISO} onChange={setDateISO} placeholder="Pick a date" />

        <Text style={styles.stepLabel}>Step 3 · Private label (optional)</Text>
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
  return `This might ask more of you than this window naturally gives. You'll be in your ${phase} phase on this date — want to look at a better day?`;
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
  betterDatesBox: {
    width: '100%',
    backgroundColor: '#E8EFE1',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  betterDatesTitle: { fontSize: 13, fontWeight: '700', color: '#3A5C2C' },
  betterDatesList: { gap: 8 },
  betterDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  betterDateText: { fontSize: 15, fontWeight: '600', color: '#3A5C2C' },
  betterDateArrow: { fontSize: 16, color: '#56723F', fontWeight: '700' },
});

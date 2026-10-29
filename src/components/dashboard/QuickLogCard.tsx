import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, type Href } from 'expo-router';

const LOG_HISTORY = '/log-history' as Href;
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { MOODS_QUICK, useDailyLog } from '@/lib/stores/useDailyLog';
import { CheckInDetails, type CheckInDetailsValue } from '@/components/adaptive/CheckInDetails';
import { resolveMode } from '@/lib/adaptive/mode';
import { useAppStore } from '@/lib/stores/useAppStore';

interface Props {
  dateISO: string;
}

function hint(energy: number, mood: string): string | null {
  if (energy === 0 && mood === '') return 'Tap an energy level and a mood to save';
  if (energy === 0) return 'Tap an energy level (1–5) to save';
  if (mood === '') return 'Tap a mood emoji to save';
  return null;
}

/** Component E — Quick Log: energy (1–5), mood (emoji), one win. */
export function QuickLogCard({ dateISO }: Props) {
  const existing = useDailyLog((s) => s.logs[dateISO]);
  const setLog   = useDailyLog((s) => s.setLog);
  const mode     = resolveMode(useAppStore((s) => s.profile));

  const [energy,  setEnergy]  = useState<number>(existing?.energy ?? 0);
  const [mood,    setMood]    = useState<string>(existing?.mood   ?? '');
  const [win,     setWin]     = useState<string>(existing?.win    ?? '');
  const [editing, setEditing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [details, setDetails] = useState<CheckInDetailsValue>({
    focus: existing?.focus,
    decisionConfidence: existing?.decisionConfidence,
    sleepQuality: existing?.sleepQuality,
    sleepHours: existing?.sleepHours,
    stress: existing?.stress,
    symptoms: existing?.symptoms ?? [],
    bleeding: existing?.bleeding,
  });
  // The optional extra inputs open in a popup so the card stays a 20-second log.
  const [showDetails, setShowDetails] = useState(false);
  const detailCount =
    [details.focus, details.decisionConfidence, details.sleepQuality, details.sleepHours, details.stress, details.bleeding]
      .filter((v) => v !== undefined && v !== null && v !== '').length + (details.symptoms.length > 0 ? 1 : 0);

  // Popup transition: the backdrop fades and the card scales 0.92 → 1 on open,
  // and plays back in reverse on close before the popup is removed.
  const popup = useSharedValue(0);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: popup.value }));
  const popupStyle = useAnimatedStyle(() => ({
    opacity: popup.value,
    transform: [{ scale: 0.92 + 0.08 * popup.value }],
  }));
  function openDetails() {
    setShowDetails(true);
    popup.value = 0;
    popup.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
  }
  function closeDetails() {
    popup.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setShowDetails)(false);
    });
  }

  const canSubmit = energy > 0 && mood !== '';
  const hintText  = hint(energy, mood);
  const logged    = !!existing && !editing;

  if (logged) {
    const moodEmoji = MOODS_QUICK.find((m) => m.key === existing!.mood)?.emoji ?? '🙂';
    return (
      <View style={styles.card}>
        <View style={styles.loggedHeader}>
          <Pressable onPress={() => router.push(LOG_HISTORY)} hitSlop={8}>
            <Text style={styles.title}>Quick Log <Text style={styles.historyLink}>· History ›</Text></Text>
          </Pressable>
          <View style={styles.loggedPill}>
            <Text style={styles.loggedPillText}>✓ Logged today</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Summary label="Energy" value={`${existing!.energy}/5`} />
          <Summary label="Mood"   value={moodEmoji} />
          {existing!.focus !== undefined && <Summary label="Focus" value={`${existing!.focus}/5`} />}
          {existing!.sleepQuality !== undefined && <Summary label="Sleep" value={`${existing!.sleepQuality}/5`} />}
        </View>
        {!!existing!.win && (
          <Text style={styles.winSummary}>"{existing!.win}"</Text>
        )}
        <Pressable onPress={() => setEditing(true)} hitSlop={6}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>
    );
  }

  function handleSave() {
    if (!canSubmit) {
      setShowHint(true);
      if (Platform.OS === 'web') {
        // Hint text below the button is enough on web.
      }
      return;
    }
    setLog({
      dateISO,
      energy,
      mood,
      win: win.trim(),
      ...(details.focus !== undefined && { focus: details.focus }),
      ...(details.decisionConfidence !== undefined && { decisionConfidence: details.decisionConfidence }),
      ...(details.sleepQuality !== undefined && { sleepQuality: details.sleepQuality }),
      ...(details.sleepHours !== undefined && { sleepHours: details.sleepHours }),
      ...(details.stress !== undefined && { stress: details.stress }),
      ...(details.symptoms.length > 0 && { symptoms: details.symptoms }),
      ...(details.bleeding !== undefined && { bleeding: details.bleeding }),
    });
    setEditing(false);
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.card}>
      <Pressable onPress={() => router.push(LOG_HISTORY)} hitSlop={8}>
        <Text style={styles.title}>Quick Log <Text style={styles.historyLink}>· History ›</Text></Text>
      </Pressable>

      <Text style={styles.label}>
        Energy{energy === 0 && showHint ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => { setEnergy(n); setShowHint(false); }}
            style={[
              styles.scaleDot,
              energy >= n && styles.scaleDotActive,
              energy === 0 && showHint && styles.scaleDotError,
            ]}
          >
            <Text style={[styles.scaleNum, energy >= n && styles.scaleNumActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>
        Mood{mood === '' && showHint ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.moodRow}>
        {MOODS_QUICK.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => { setMood(m.key); setShowHint(false); }}
            style={[
              styles.moodChip,
              mood === m.key && styles.moodChipActive,
              mood === '' && showHint && styles.moodChipError,
            ]}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={openDetails}
        hitSlop={6}
        testID="toggle-details"
        accessibilityRole="button"
        accessibilityLabel={detailCount > 0 ? `Details added, ${detailCount}. Edit details` : 'Add more detail, optional'}
      >
        <Text style={styles.moreToggle}>
          {detailCount > 0
            ? `✓ ${detailCount} detail${detailCount === 1 ? '' : 's'} added · Edit`
            : mode !== 'regular'
              ? '+ More detail — sleep, focus, symptoms (helps your plan)'
              : '+ More detail (optional)'}
        </Text>
      </Pressable>

      {/* Centred popup with a smooth fade + scale both ways. */}
      <Modal visible={showDetails} transparent animationType="none" onRequestClose={closeDetails}>
        <View style={styles.sheetOverlay}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDetails} accessibilityLabel="Close" />
          </Animated.View>
          <Animated.View style={[styles.sheet, popupStyle]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} accessibilityRole="header">More detail</Text>
              <Pressable onPress={closeDetails} hitSlop={12} accessibilityLabel="Close">
                <Text style={styles.sheetClose}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.sheetSub}>All optional — skip anything you like.</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <CheckInDetails value={details} onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))} mode={mode} />
            </ScrollView>
            <Pressable style={styles.submit} onPress={closeDetails} testID="details-done">
              <Text style={styles.submitText}>Done</Text>
            </Pressable>
            <Text style={styles.sheetNote}>Your details are kept with today's log when you tap Save log.</Text>
          </Animated.View>
        </View>
      </Modal>

      <Text style={styles.label}>One win</Text>
      <TextInput
        placeholder="One good thing today…"
        placeholderTextColor={dash.muted}
        value={win}
        onChangeText={(t) => setWin(t.slice(0, 60))}
        maxLength={60}
        style={styles.input}
      />
      <Text style={styles.counter}>{win.length}/60</Text>

      <Pressable style={styles.submit} onPress={handleSave}>
        <Text style={styles.submitText}>Save log</Text>
      </Pressable>

      {showHint && hintText ? (
        <Text style={styles.hintText}>{hintText}</Text>
      ) : null}
    </Animated.View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 22,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: dash.line,
  },
  title: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink },
  moreToggle: { fontSize: 13, fontWeight: '700', color: dash.sageDeep, marginTop: 10, paddingVertical: 4 },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.38)' },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '86%',
    backgroundColor: dash.card,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 8,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink },
  sheetClose: { fontSize: 16, color: dash.inkSoft },
  sheetSub: { fontSize: 13, color: dash.inkSoft },
  sheetNote: { fontSize: 11.5, color: dash.inkSoft, textAlign: 'center' },
  historyLink: { fontSize: 13, color: dash.sage, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', color: dash.inkSoft, marginTop: 8 },
  required: { color: '#C2683F' },
  scaleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  scaleDot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: dash.bg,
    borderWidth: 1.5,
    borderColor: dash.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleDotActive: { backgroundColor: dash.sageTint, borderColor: dash.sage },
  scaleDotError:  { borderColor: '#C2683F' },
  scaleNum: { fontSize: 16, fontWeight: '700', color: dash.muted },
  scaleNumActive: { color: dash.sageDeep },
  moodRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  moodChip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: dash.bg,
    borderWidth: 1.5,
    borderColor: dash.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodChipActive: { backgroundColor: dash.clayTint, borderColor: dash.clay },
  moodChipError:  { borderColor: '#C2683F' },
  moodEmoji: { fontSize: 22 },
  input: {
    backgroundColor: dash.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dash.line,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: dash.ink,
    marginTop: 4,
  },
  counter: { fontSize: 11, color: dash.muted, textAlign: 'right' },
  submit: {
    backgroundColor: dash.sage,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText:  { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  hintText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#C2683F',
    fontWeight: '600',
    marginTop: 2,
  },
  loggedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loggedPill: { backgroundColor: dash.sageTint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  loggedPillText: { fontSize: 12, fontWeight: '700', color: dash.sageDeep },
  summaryRow: { flexDirection: 'row', gap: 28, marginTop: 6 },
  summary: { gap: 2 },
  summaryValue: { fontFamily: fonts.heading, fontSize: 22, color: dash.ink },
  summaryLabel: { fontSize: 12, color: dash.muted },
  winSummary: { fontSize: 15, color: dash.inkSoft, fontStyle: 'italic', marginTop: 8 },
  edit: { fontSize: 14, fontWeight: '700', color: dash.sage, marginTop: 10 },
});

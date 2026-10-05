import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { BLEEDING_OPTIONS, SYMPTOMS } from '@/lib/adaptive/types';
import type { AdaptiveMode } from '@/lib/adaptive/types';

export interface CheckInDetailsValue {
  focus?: number;
  decisionConfidence?: number;
  sleepQuality?: number;
  sleepHours?: number;
  stress?: number;
  symptoms: string[];
  bleeding?: string;
}

interface Props {
  value: CheckInDetailsValue;
  onChange: (patch: Partial<CheckInDetailsValue>) => void;
  mode: AdaptiveMode;
}

function Scale({
  label,
  hint,
  value,
  onChange,
  testID,
}: {
  label: string;
  hint?: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  testID: string;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}>  {hint}</Text> : null}
      </Text>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = (value ?? 0) >= n;
          return (
            <Pressable
              key={n}
              testID={`${testID}-${n}`}
              onPress={() => onChange(value === n ? undefined : n)}
              style={[styles.dot, on && styles.dotActive]}
            >
              <Text style={[styles.dotNum, on && styles.dotNumActive]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const HOURS = [5, 6, 7, 8, 9];

/** The optional "more detail" part of the daily check-in. Everything here can be skipped. */
export function CheckInDetails({ value, onChange, mode }: Props) {
  const symptoms = SYMPTOMS.filter((s) => !s.perimenopause || mode === 'perimenopause');
  const toggleSymptom = (id: string) =>
    onChange({ symptoms: value.symptoms.includes(id) ? value.symptoms.filter((s) => s !== id) : [...value.symptoms, id] });

  return (
    <View style={styles.wrap}>
      <Scale label="Focus" value={value.focus} onChange={(v) => onChange({ focus: v })} testID="focus" />
      <Scale
        label="Decision confidence"
        hint="how sure you'd feel making a call"
        value={value.decisionConfidence}
        onChange={(v) => onChange({ decisionConfidence: v })}
        testID="confidence"
      />
      <Scale label="Sleep quality" value={value.sleepQuality} onChange={(v) => onChange({ sleepQuality: v })} testID="sleep" />

      <View style={styles.block}>
        <Text style={styles.label}>
          Hours slept<Text style={styles.hint}>  optional</Text>
        </Text>
        <View style={styles.chips}>
          {HOURS.map((h) => {
            const on = value.sleepHours === h;
            return (
              <Pressable
                key={h}
                onPress={() => onChange({ sleepHours: on ? undefined : h })}
                style={[styles.chip, on && styles.chipActive]}
              >
                <Text style={[styles.chipText, on && styles.chipTextActive]}>{h === 9 ? '9+' : h}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Scale
        label="Stress"
        hint="1 calm · 5 very stressed"
        value={value.stress}
        onChange={(v) => onChange({ stress: v })}
        testID="stress"
      />

      <View style={styles.block}>
        <Text style={styles.label}>
          Symptoms<Text style={styles.hint}>  optional · what you notice</Text>
        </Text>
        <View style={styles.chips}>
          {symptoms.map((s) => {
            const on = value.symptoms.includes(s.id);
            return (
              <Pressable key={s.id} onPress={() => toggleSymptom(s.id)} style={[styles.chip, on && styles.chipActive]}>
                <Text style={[styles.chipText, on && styles.chipTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.label}>
          Bleeding<Text style={styles.hint}>  optional</Text>
        </Text>
        <View style={styles.chips}>
          {BLEEDING_OPTIONS.map((b) => {
            const on = value.bleeding === b.id;
            return (
              <Pressable
                key={b.id}
                onPress={() => onChange({ bleeding: on ? undefined : b.id })}
                style={[styles.chip, on && styles.chipActive]}
              >
                <Text style={[styles.chipText, on && styles.chipTextActive]}>{b.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 4 },
  block: { gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: dash.inkSoft, marginTop: 6 },
  hint: { fontSize: 11.5, fontWeight: '500', color: dash.muted },
  scaleRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  dot: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: dash.bg,
    borderWidth: 1.5,
    borderColor: dash.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: dash.sageTint, borderColor: dash.sage },
  dotNum: { fontSize: 14, fontWeight: '700', color: dash.muted },
  dotNumActive: { color: dash.sageDeep },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: {
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: dash.bg,
    borderWidth: 1.5,
    borderColor: dash.line,
  },
  chipActive: { backgroundColor: dash.sage, borderColor: dash.sage },
  chipText: { fontSize: 12.5, fontWeight: '600', color: dash.ink },
  chipTextActive: { color: '#FFFFFF' },
});

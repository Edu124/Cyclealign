import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { CycleRegularity, HealthContext } from '@/types/models';

interface RegularityOption {
  id: string;
  label: string;
  value: CycleRegularity;
}

const REGULARITY_OPTIONS: RegularityOption[] = [
  { id: 'very', label: 'Very predictable', value: 'REGULAR' },
  { id: 'usually', label: 'Usually predictable, but varies sometimes', value: 'VARIABLE' },
  { id: 'irregular', label: 'Irregular / unpredictable', value: 'IRREGULAR' },
  { id: 'changing', label: 'My cycle has been changing recently', value: 'CHANGING' },
  { id: 'none', label: "I don't currently have predictable periods", value: 'IRREGULAR' },
  { id: 'unsure', label: "I'm not sure", value: 'UNKNOWN' },
];

const CONTEXT_OPTIONS: { label: string; value: HealthContext }[] = [
  { label: 'Regular menstrual cycle', value: 'REGULAR' },
  { label: 'PCOS / PCOD', value: 'PCOS' },
  { label: 'Irregular cycles', value: 'IRREGULAR' },
  { label: 'Perimenopause / menopause transition', value: 'PERIMENOPAUSE' },
  { label: 'Postpartum', value: 'POSTPARTUM' },
  { label: 'Other', value: 'OTHER' },
  { label: "I'm not sure", value: 'UNKNOWN' },
];

export const REGULARITY_LABEL: Record<CycleRegularity, string> = {
  REGULAR: 'Very predictable cycles',
  VARIABLE: 'Usually predictable, varies sometimes',
  IRREGULAR: 'Irregular / unpredictable cycles',
  CHANGING: 'Cycle has been changing recently',
  UNKNOWN: 'Not sure how predictable',
};

export const CONTEXT_LABEL: Record<HealthContext, string> = {
  REGULAR: 'Regular menstrual cycle',
  PCOS: 'PCOS / PCOD',
  IRREGULAR: 'Irregular cycles',
  PERIMENOPAUSE: 'Perimenopause / menopause transition',
  POSTPARTUM: 'Postpartum',
  OTHER: 'Other',
  UNKNOWN: 'Not sure',
};

const RANGE_OPTIONS = ['<21', '21–28', '29–35', '36–45', '46–60', '60+', 'Varies too much to say'];

export interface PersonalizeValue {
  cycleRegularity: CycleRegularity | null;
  healthContext: HealthContext | null;
  cycleLengthRange: string | null;
}

interface Props {
  value: PersonalizeValue;
  onChange: (patch: Partial<PersonalizeValue>) => void;
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionActive]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={[styles.radio, selected && styles.radioActive]}>{selected && <View style={styles.radioDot} />}</View>
      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );
}

/**
 * The two optional profile questions. Both are information she gives us to
 * personalise recommendations — never a diagnosis — and either can be skipped.
 */
export function PersonalizeForm({ value, onChange }: Props) {
  // Two options map to IRREGULAR, so remember which row she actually tapped.
  const [choiceId, setChoiceId] = useState<string | null>(
    REGULARITY_OPTIONS.find((o) => o.value === value.cycleRegularity)?.id ?? null,
  );
  const variable = value.cycleRegularity === 'IRREGULAR' || value.cycleRegularity === 'CHANGING' || value.healthContext === 'PCOS';

  return (
    <View style={{ gap: 22 }}>
      <View style={styles.group}>
        <Text style={styles.q}>How predictable are your cycles?</Text>
        {REGULARITY_OPTIONS.map((o) => (
          <Option
            key={o.id}
            label={o.label}
            selected={choiceId === o.id}
            onPress={() => {
              setChoiceId(o.id);
              onChange({ cycleRegularity: o.value });
            }}
          />
        ))}
      </View>

      <View style={styles.group}>
        <Text style={styles.q}>Which best describes your situation?</Text>
        <Text style={styles.note}>This is context you choose to share, not a diagnosis.</Text>
        {CONTEXT_OPTIONS.map((o) => (
          <Option
            key={o.value}
            label={o.label}
            selected={value.healthContext === o.value}
            onPress={() => onChange({ healthContext: o.value })}
          />
        ))}
      </View>

      {variable && (
        <View style={styles.group}>
          <Text style={styles.q}>Recent cycle length (optional)</Text>
          <View style={styles.chips}>
            {RANGE_OPTIONS.map((r) => {
              const on = value.cycleLengthRange === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => onChange({ cycleLengthRange: on ? null : r })}
                  style={[styles.chip, on && styles.chipActive]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextActive]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  q: { fontFamily: fonts.heading, fontSize: 17, color: dash.ink, marginBottom: 2 },
  note: { fontSize: 12.5, color: dash.muted, marginBottom: 2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dash.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: dash.line,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  optionActive: { borderColor: dash.sage, backgroundColor: dash.sageTint },
  optionText: { flex: 1, fontSize: 14.5, color: dash.ink },
  optionTextActive: { fontWeight: '700', color: dash.sageDeep },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: dash.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: dash.sage },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: dash.sage },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: dash.card,
    borderWidth: 1.5,
    borderColor: dash.line,
  },
  chipActive: { backgroundColor: dash.sage, borderColor: dash.sage },
  chipText: { fontSize: 13, fontWeight: '600', color: dash.ink },
  chipTextActive: { color: '#FFFFFF' },
});

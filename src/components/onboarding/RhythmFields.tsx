import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stepper } from '@/components/ui';
import { MAX_CYCLE, MAX_PERIOD, MIN_CYCLE, MIN_PERIOD } from '@/lib/prediction/engine';
import type { RhythmPreference } from '@/types/models';
import { palette } from '@/theme';

export interface RhythmValue {
  cycleLength: number;
  cyclePref: RhythmPreference;
  periodLength: number;
  periodPref: RhythmPreference;
}

interface Props {
  value: RhythmValue;
  onChange: (patch: Partial<RhythmValue>) => void;
}

const CYCLE_OPTIONS: { pref: RhythmPreference; label: string }[] = [
  { pref: 'known', label: 'I know my usual cycle length' },
  { pref: 'varies', label: 'My cycle varies from month to month' },
  { pref: 'unsure', label: "I'm not sure yet" },
];

const PERIOD_OPTIONS: { pref: RhythmPreference; label: string }[] = [
  { pref: 'known', label: 'I know my usual period duration' },
  { pref: 'varies', label: 'It varies from month to month' },
  { pref: 'unsure', label: "I'm not sure yet" },
];

/**
 * The two "rhythm" questions (cycle length 15–90 days, period 1–15 days), each
 * with known / varies / not sure. The number is only asked for — and only
 * stored as hers — when she picks the "I know" option.
 */
export function RhythmFields({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Text style={styles.label}>How long is your usual cycle?</Text>
        <Text style={styles.helper}>Count from the first day of one period to the first day of the next.</Text>
        <Options options={CYCLE_OPTIONS} selected={value.cyclePref} onSelect={(cyclePref) => onChange({ cyclePref })} />
        {value.cyclePref === 'known' && (
          <Stepper
            label="Usual cycle"
            value={value.cycleLength}
            min={MIN_CYCLE}
            max={MAX_CYCLE}
            unit="days"
            onChange={(cycleLength) => onChange({ cycleLength })}
          />
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>How long does your period usually last?</Text>
        <Options options={PERIOD_OPTIONS} selected={value.periodPref} onSelect={(periodPref) => onChange({ periodPref })} />
        {value.periodPref === 'known' && (
          <Stepper
            label="Usual period"
            value={value.periodLength}
            min={MIN_PERIOD}
            max={MAX_PERIOD}
            unit={value.periodLength === 1 ? 'day' : 'days'}
            onChange={(periodLength) => onChange({ periodLength })}
          />
        )}
      </View>
    </View>
  );
}

function Options({
  options,
  selected,
  onSelect,
}: {
  options: { pref: RhythmPreference; label: string }[];
  selected: RhythmPreference;
  onSelect: (pref: RhythmPreference) => void;
}) {
  return (
    <View style={styles.options} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.pref === selected;
        return (
          <Pressable
            key={o.pref}
            onPress={() => onSelect(o.pref)}
            style={[styles.option, on && styles.optionOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
            <Text style={[styles.optionText, on && styles.optionTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 26 },
  field: { gap: 10 },
  label: { fontSize: 16, fontWeight: '700', color: palette.ink },
  helper: { fontSize: 13, color: palette.inkSoft, lineHeight: 18, marginTop: -4 },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  optionOn: { borderColor: palette.lavenderDeep, backgroundColor: '#F4EFFB' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: palette.lavenderDeep },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.lavenderDeep },
  optionText: { flex: 1, fontSize: 14, color: palette.inkSoft, fontWeight: '500' },
  optionTextOn: { color: palette.ink, fontWeight: '600' },
});

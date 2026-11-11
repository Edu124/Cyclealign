import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { Stepper } from '@/components/ui';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { useFeatureFlags } from '@/lib/featureFlags';
import { RhythmFields } from '@/components/onboarding/RhythmFields';
import { palette } from '@/theme';

/** Step 3 of 6. The rhythm version can be switched off remotely (feature_flags.rhythmOnboarding). */
export default function CycleStep() {
  const rhythm = useFeatureFlags((s) => s.rhythmOnboarding);
  return rhythm ? <RhythmStep /> : <LegacyCycleStep />;
}

/**
 * "Let's understand your rhythm": cycle length 15–90 days and period 1–15
 * days, each with known / varies / not sure. Never blocks onboarding; a
 * number is only kept as hers when she chooses the "I know" option.
 */
function RhythmStep() {
  const { avgCycleLength, avgPeriodLength, cycleLengthPreference, periodDurationPreference, set } = useOnboarding();
  return (
    <StepScaffold
      step={3}
      total={6}
      title="Let's understand your rhythm"
      subtitle="Every woman is different. A little about your cycle helps us tailor productivity tips to you."
      onNext={() => router.push('/onboarding/personalize' as Href)}
    >
      <RhythmFields
        value={{
          cycleLength: avgCycleLength,
          cyclePref: cycleLengthPreference,
          periodLength: avgPeriodLength,
          periodPref: periodDurationPreference,
        }}
        onChange={(p) =>
          set({
            ...(p.cycleLength !== undefined && { avgCycleLength: p.cycleLength }),
            ...(p.periodLength !== undefined && { avgPeriodLength: p.periodLength }),
            ...(p.cyclePref && { cycleLengthPreference: p.cyclePref, unknownCycleLength: p.cyclePref !== 'known' }),
            ...(p.periodPref && { periodDurationPreference: p.periodPref }),
          })
        }
      />
      <Text style={styles.footer}>
        You can update this anytime. We'll use what you share to help personalize your planning experience.
      </Text>
    </StepScaffold>
  );
}

/** The previous step, kept so the enhancement can be switched off without a release. */
function LegacyCycleStep() {
  const { avgCycleLength, avgPeriodLength, unknownCycleLength, set } = useOnboarding();
  const savedCycleLength = useRef(avgCycleLength);

  function toggleUnknown() {
    if (!unknownCycleLength) {
      savedCycleLength.current = avgCycleLength;
      set({ unknownCycleLength: true, avgCycleLength: 28, cycleLengthPreference: 'unsure' });
    } else {
      set({ unknownCycleLength: false, avgCycleLength: savedCycleLength.current, cycleLengthPreference: 'known' });
    }
  }

  return (
    <StepScaffold
      step={3}
      total={6}
      title="About your cycle"
      subtitle="This helps us map your phases accurately. You can always update these later."
      onNext={() => router.push('/onboarding/personalize' as Href)}
    >
      {/* Cycle length */}
      <View>
        <Stepper
          label="How long is your average cycle?"
          value={avgCycleLength}
          min={21}
          max={35}
          unit="days"
          onChange={(v) => set({ avgCycleLength: v })}
          disabled={unknownCycleLength}
        />
        <TouchableOpacity
          onPress={toggleUnknown}
          style={styles.unknownRow}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, unknownCycleLength && styles.checkboxChecked]}>
            {unknownCycleLength && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.unknownLabel}>I don't know my cycle length</Text>
        </TouchableOpacity>
        {unknownCycleLength && (
          <Text style={styles.unknownHint}>
            We'll use 28 days and refine it as you log more cycles.
          </Text>
        )}
      </View>

      {/* Period length */}
      <Stepper
        label="How long does your period usually last?"
        value={avgPeriodLength}
        min={2}
        max={10}
        unit="days"
        onChange={(v) => set({ avgPeriodLength: v })}
      />
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  footer: { fontSize: 13, color: palette.inkSoft, lineHeight: 19, textAlign: 'center', marginTop: 4 },
  unknownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: palette.lavenderDeep,
    backgroundColor: palette.lavenderDeep,
  },
  checkmark: { fontSize: 13, color: '#fff', fontWeight: '800' },
  unknownLabel: { fontSize: 14, color: palette.inkSoft, fontWeight: '500' },
  unknownHint: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 6,
    marginLeft: 32,
    lineHeight: 17,
  },
});

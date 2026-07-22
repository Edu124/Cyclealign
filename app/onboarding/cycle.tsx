import { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { Stepper } from '@/components/ui';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { palette } from '@/theme';

export default function CycleStep() {
  const { avgCycleLength, avgPeriodLength, unknownCycleLength, set } = useOnboarding();
  const savedCycleLength = useRef(avgCycleLength);

  function toggleUnknown() {
    if (!unknownCycleLength) {
      savedCycleLength.current = avgCycleLength;
      set({ unknownCycleLength: true, avgCycleLength: 28 });
    } else {
      set({ unknownCycleLength: false, avgCycleLength: savedCycleLength.current });
    }
  }

  return (
    <StepScaffold
      step={3}
      total={5}
      title="About your cycle"
      subtitle="This helps us map your phases accurately. You can always update these later."
      onNext={() => router.push('/onboarding/period')}
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
        max={8}
        unit="days"
        onChange={(v) => set({ avgPeriodLength: v })}
      />
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
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

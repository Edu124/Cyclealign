import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { DateField, Stepper } from '@/components/ui';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { predictionEngine } from '@/lib/prediction/engine';
import { fromISODate } from '@/lib/dates';
import { palette, radius, spacing } from '@/theme';

export default function CycleStep() {
  const {
    lastPeriodStart,
    avgCycleLength,
    avgPeriodLength,
    unknownCycleLength,
    set,
  } = useOnboarding();

  const preview = lastPeriodStart
    ? predictionEngine.predict({
        lastPeriodStart,
        avgCycleLength,
        avgPeriodLength,
      })
    : null;

  function toggleUnknown() {
    set({
      unknownCycleLength: !unknownCycleLength,
      avgCycleLength: 28,
    });
  }

  return (
    <StepScaffold
      step={2}
      total={3}
      title="Your last period"
      subtitle="Tell us about your cycle so we can calculate your phase accurately."
      nextDisabled={!lastPeriodStart}
      onNext={() => router.push('/onboarding/notifications')}
    >
      <DateField
        label="When did your last period start?"
        placeholder="Tap to choose the date"
        value={lastPeriodStart}
        onChange={(iso) => set({ lastPeriodStart: iso })}
        disableFuture
        minYear={new Date().getFullYear() - 2}
      />

      {/* Cycle length with "I don't know" toggle */}
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
            We'll use 28 days and refine it after your first logged cycle.
          </Text>
        )}
      </View>

      <Stepper
        label="How long does your period usually last?"
        value={avgPeriodLength}
        min={2}
        max={8}
        unit="days"
        onChange={(v) => set({ avgPeriodLength: v })}
      />

      {preview && (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>NEXT PERIOD EXPECTED</Text>
          <Text style={styles.previewDate}>
            {format(fromISODate(preview.nextPeriodStart), 'EEEE, d MMMM')}
          </Text>
          <Text style={styles.previewSub}>
            {unknownCycleLength
              ? "Estimated using a 28-day cycle — we'll refine this as you log data."
              : "We'll refine this as you log more cycles."}
          </Text>
        </View>
      )}
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
  preview: {
    backgroundColor: '#FBE9F1',
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: palette.roseDeep,
  },
  previewDate: { fontSize: 20, fontWeight: '800', color: palette.ink },
  previewSub: { fontSize: 13, color: palette.inkSoft },
});

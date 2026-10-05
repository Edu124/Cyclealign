import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { PersonalizeForm } from '@/components/adaptive/PersonalizeForm';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { palette } from '@/theme';

export default function PersonalizeStep() {
  const { cycleRegularity, healthContext, cycleLengthRange, set } = useOnboarding();

  return (
    <StepScaffold
      step={4}
      total={6}
      title="Make CycleAlign fit you"
      subtitle="Cycles aren't all the same. These two optional questions help us tune your recommendations."
      onNext={() => router.push('/onboarding/period')}
    >
      <PersonalizeForm
        value={{ cycleRegularity, healthContext, cycleLengthRange }}
        onChange={(patch) => set(patch)}
      />
      <TouchableOpacity
        onPress={() => {
          set({ cycleRegularity: null, healthContext: null, cycleLengthRange: null });
          router.push('/onboarding/period');
        }}
        hitSlop={10}
      >
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  skip: { textAlign: 'center', color: palette.muted, fontSize: 14, fontWeight: '600', paddingVertical: 8 },
});

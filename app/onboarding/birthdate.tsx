import { router } from 'expo-router';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { DateField } from '@/components/ui';
import { useOnboarding } from '@/lib/stores/useOnboarding';

export default function BirthdateStep() {
  const { birthDate, set } = useOnboarding();

  return (
    <StepScaffold
      step={2}
      total={5}
      title="When were you born?"
      subtitle="Your age helps us tailor insights to your stage of life."
      nextDisabled={!birthDate}
      onNext={() => router.push('/onboarding/cycle')}
    >
      <DateField
        label="Date of birth"
        placeholder="Tap to choose your birth date"
        value={birthDate}
        onChange={(iso) => set({ birthDate: iso })}
        disableFuture
        initialView="years"
      />
    </StepScaffold>
  );
}

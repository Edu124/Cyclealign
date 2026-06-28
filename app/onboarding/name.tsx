import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { TextField } from '@/components/ui';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { Gender } from '@/types/models';
import { palette, radius, spacing } from '@/theme';

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'female', label: 'Female' },
  { key: 'non_binary', label: 'Non-binary' },
  { key: 'male', label: 'Male' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function NameStep() {
  const { name, gender, set } = useOnboarding();

  return (
    <StepScaffold
      step={2}
      total={4}
      title="What should we call you?"
      subtitle="We'll use this to personalise your experience."
      nextDisabled={name.trim().length === 0}
      onNext={() => router.push('/onboarding/birthdate')}
    >
      <TextField
        label="Your name"
        placeholder="e.g. Vinita"
        value={name}
        onChangeText={(t) => set({ name: t })}
        autoFocus
      />

      <View>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.options}>
          {GENDERS.map((g) => {
            const selected = gender === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => set({ gender: g.key })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {g.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.inkSoft,
    marginLeft: spacing.xs,
    marginBottom: spacing.md,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  chipSelected: {
    borderColor: palette.roseDeep,
    backgroundColor: '#FBE9F1',
  },
  chipText: { fontSize: 14, fontWeight: '600', color: palette.inkSoft },
  chipTextSelected: { color: palette.roseDeep },
});

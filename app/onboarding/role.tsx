import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StepScaffold } from '@/components/onboarding/StepScaffold';
import { useOnboarding } from '@/lib/stores/useOnboarding';
import { ROLE_OPTIONS } from '@/lib/roles';
import { palette, radius, spacing } from '@/theme';

export default function RoleStep() {
  const { role, set } = useOnboarding();

  return (
    <StepScaffold
      step={1}
      total={5}
      title="Every woman leads something."
      subtitle="What does your leadership look like right now?"
      nextDisabled={!role}
      onNext={() => router.push('/onboarding/birthdate')}
    >
      <View style={styles.options}>
        {ROLE_OPTIONS.map((opt, i) => {
          const selected = role === opt.value;
          return (
            <Animated.View key={opt.value} entering={FadeInDown.delay(i * 60).duration(400)}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  set({ role: opt.value });
                }}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionHint}>{opt.hint}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </StepScaffold>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: palette.line,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  optionSelected: {
    borderColor: palette.lavenderDeep,
    backgroundColor: '#EFF3E9',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: palette.lavenderDeep },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.lavenderDeep,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: palette.ink },
  optionLabelSelected: { color: palette.lavenderDeep },
  optionHint: { fontSize: 13, color: palette.muted, marginTop: 2 },
});

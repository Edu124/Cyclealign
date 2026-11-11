import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/dashboard/Icon';
import { PersonalizeForm, type PersonalizeValue } from '@/components/adaptive/PersonalizeForm';
import { RhythmFields, type RhythmValue } from '@/components/onboarding/RhythmFields';
import { rhythmToProfile } from '@/lib/rhythm';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useAdaptivePrefs } from '@/lib/stores/useAdaptivePrefs';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';

/** "Personalize CycleAlign" — for existing users, and for changing the answers later. */
export default function Personalize() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const dismiss = useAdaptivePrefs((s) => s.dismissPersonalize);

  const [value, setValue] = useState<PersonalizeValue>({
    cycleRegularity: profile?.cycleRegularity ?? null,
    healthContext: profile?.healthContext ?? null,
    cycleLengthRange: profile?.cycleLengthRange ?? null,
  });

  // "You can update this anytime": her rhythm answers, editable here.
  const rhythmOn = useFeatureFlags((s) => s.rhythmOnboarding);
  const initialRhythm: RhythmValue = {
    cycleLength: profile?.avgCycleLength ?? 28,
    cyclePref: profile?.cycleLengthPreference ?? 'known',
    periodLength: profile?.avgPeriodLength ?? 5,
    periodPref: profile?.periodDurationPreference ?? 'known',
  };
  const [rhythm, setRhythm] = useState<RhythmValue>(initialRhythm);
  const rhythmChanged = JSON.stringify(rhythm) !== JSON.stringify(initialRhythm);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/today'));
  const canSave = value.cycleRegularity !== null || value.healthContext !== null || rhythmChanged;

  const save = () => {
    updateProfile({
      cycleRegularity: value.cycleRegularity ?? undefined,
      healthContext: value.healthContext ?? undefined,
      cycleLengthRange: value.cycleLengthRange ?? undefined,
      // Only fields she changed: unrelated records and settings stay untouched.
      ...(rhythmChanged &&
        rhythmToProfile({
          avgCycleLength: rhythm.cycleLength,
          avgPeriodLength: rhythm.periodLength,
          cycleLengthPreference: rhythm.cyclePref,
          periodDurationPreference: rhythm.periodPref,
        })),
    });
    dismiss();
    goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}>
          <Icon name="chevronLeft" color={dash.ink} size={24} />
        </Pressable>
        <Text style={styles.title}>Personalize CycleAlign</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Your cycle is one input, not the whole picture. Tell us a little about yours and we'll shape recommendations around how you actually feel and work.
          Nothing changes if you skip this.
        </Text>
        {rhythmOn && (
          <>
            <Text style={styles.section}>Your rhythm</Text>
            <RhythmFields value={rhythm} onChange={(patch) => setRhythm((r) => ({ ...r, ...patch }))} />
          </>
        )}
        <PersonalizeForm value={value} onChange={(patch) => setValue((v) => ({ ...v, ...patch }))} />
      </ScrollView>
      <View style={styles.footer}>
        <Pressable style={[styles.cta, !canSave && { opacity: 0.5 }]} disabled={!canSave} onPress={save}>
          <Text style={styles.ctaText}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dash.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 20, color: dash.ink },
  content: { padding: 20, gap: 18, paddingBottom: 30 },
  intro: { fontSize: 14, color: dash.inkSoft, lineHeight: 20 },
  section: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink, marginTop: 4 },
  footer: { padding: 20, paddingTop: 8 },
  cta: { backgroundColor: dash.sage, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

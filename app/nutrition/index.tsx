import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dash, phaseBanner } from '@/theme';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { phaseReliability } from '@/lib/adaptive/mode';
import { estimateNutritionPhase } from '@/lib/nutrition/estimate';
import { PHASE_ORDER } from '@/lib/nutrition/guide';
import { useNutritionGuide } from '@/lib/nutrition/useNutritionGuide';
import { useNutritionPrefs } from '@/lib/stores/useNutritionPrefs';
import {
  Disclaimer,
  NutritionScreen,
  PhaseVisual,
  nutritionStyles as ns,
  prefsSummary,
} from '@/components/nutrition/NutritionParts';

const phaseHref = (phase: string) => `/nutrition/${phase}` as Href;

export default function NutritionHome() {
  const guide = useNutritionGuide();
  const prediction = usePrediction();
  const profile = useAppStore((s) => s.profile);
  const cycleLogs = useAppStore((s) => s.cycleLogs);
  const estimate = estimateNutritionPhase(prediction, phaseReliability(profile, cycleLogs));

  const diet = useNutritionPrefs((s) => s.diet);
  const allergies = useNutritionPrefs((s) => s.allergies);
  const avoid = useNutritionPrefs((s) => s.avoid);
  const saved = useNutritionPrefs((s) => s.saved);
  const toggleSaved = useNutritionPrefs((s) => s.toggleSaved);
  const summary = prefsSummary({ diet, allergies, avoid });

  const current = estimate.phase ? guide.phases[estimate.phase] : null;

  return (
    <NutritionScreen title="Your food guide">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={ns.title}>{guide.title}</Text>
          <Text style={ns.sub}>{guide.intro}</Text>
        </Animated.View>

        {/* Where she probably is — always as an estimate, never as a fact. */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={ns.card}>
          {estimate.phase && current ? (
            <>
              <View style={[ns.chip, { backgroundColor: phaseBanner[estimate.phase].bg }]}>
                <Text style={[ns.chipText, { color: phaseBanner[estimate.phase].accent }]}>
                  {estimate.confidence === 'rough' ? 'ROUGH ESTIMATE' : 'ESTIMATED PHASE'}
                </Text>
              </View>
              <Text style={ns.cardTitle}>You're probably in your {current.name.replace(' Phase', '').toLowerCase()} phase</Text>
              <Text style={ns.small}>{estimate.note}</Text>
              <Pressable style={ns.btn} onPress={() => router.push(phaseHref(estimate.phase!))}>
                <Text style={ns.btnText}>Open the {current.name.toLowerCase()} guide</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={ns.cardTitle}>Choose a phase</Text>
              <Text style={ns.body}>{estimate.note}</Text>
            </>
          )}
        </Animated.View>

        <Text style={ns.sectionTitle}>Browse by phase</Text>
        <View style={styles.grid}>
          {PHASE_ORDER.map((key, i) => {
            const p = guide.phases[key];
            const isCurrent = key === estimate.phase;
            return (
              <Animated.View key={key} entering={FadeInDown.delay(120 + i * 60).duration(400)} style={styles.gridItem}>
                <Pressable
                  style={[styles.phaseCard, isCurrent && { borderColor: phaseBanner[key].accent }]}
                  onPress={() => router.push(phaseHref(key))}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.label}. ${p.when}.`}
                  testID={`nutrition-phase-${key}`}
                >
                  <PhaseVisual phase={key} guide={p} />
                  <Text style={styles.phaseLabel}>{p.label}</Text>
                  <Text style={styles.phaseWhen} numberOfLines={2}>{p.when}</Text>
                  {isCurrent && (
                    <Text style={[styles.nowTag, { color: phaseBanner[key].accent }]}>Estimated now</Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Diet and allergies shape every meal idea. */}
        <View style={ns.card}>
          <Text style={ns.cardTitle}>Your food preferences</Text>
          <Text style={ns.body}>
            {summary ?? 'Tell us what you eat and anything you avoid, and we will tailor the meal ideas.'}
          </Text>
          <Pressable style={ns.ghostBtn} onPress={() => router.push('/nutrition/preferences' as Href)} testID="nutrition-prefs">
            <Text style={ns.ghostBtnText}>{summary ? 'Edit preferences' : 'Set preferences'}</Text>
          </Pressable>
        </View>

        <View style={ns.card}>
          <Text style={ns.cardTitle}>Saved tips</Text>
          {saved.length === 0 ? (
            <Text style={ns.body}>Tap ☆ next to a meal idea or reminder to keep it here.</Text>
          ) : (
            saved.map((t) => (
              <View key={t.id} style={styles.savedRow}>
                <View style={[styles.savedDot, { backgroundColor: phaseBanner[t.phase].accent }]} />
                <Pressable style={{ flex: 1 }} onPress={() => router.push(phaseHref(t.phase))}>
                  <Text style={styles.savedMeta}>
                    {guide.phases[t.phase].label.split(' — ')[0]}
                    {t.label ? ` · ${t.label}` : ''}
                  </Text>
                  <Text style={styles.savedText}>{t.text}</Text>
                </Pressable>
                <Pressable
                  onPress={() => toggleSaved(t)}
                  hitSlop={10}
                  accessibilityLabel={`Remove saved tip: ${t.text}`}
                >
                  <Text style={styles.savedStar}>★</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Disclaimer guide={guide} />
      </ScrollView>
    </NutritionScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47.8%' },
  phaseCard: {
    backgroundColor: dash.card,
    borderRadius: 20,
    padding: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: dash.line,
  },
  phaseLabel: { fontSize: 13.5, fontWeight: '800', color: dash.ink, lineHeight: 18, marginTop: 2 },
  phaseWhen: { fontSize: 12, color: dash.inkSoft, lineHeight: 16 },
  nowTag: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  savedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  savedDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  savedMeta: { fontSize: 11.5, fontWeight: '800', color: dash.muted, letterSpacing: 0.2 },
  savedText: { fontSize: 14, color: dash.ink, lineHeight: 20 },
  savedStar: { fontSize: 20, color: '#C9A96E' },
});

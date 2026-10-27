import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dash, phaseBanner } from '@/theme';
import type { PhaseKey } from '@/types/models';
import { usePrediction } from '@/lib/hooks/usePrediction';
import { useAppStore } from '@/lib/stores/useAppStore';
import { phaseReliability } from '@/lib/adaptive/mode';
import { estimateNutritionPhase } from '@/lib/nutrition/estimate';
import { PHASE_ORDER, type MealOption } from '@/lib/nutrition/guide';
import { formatFoodGroup, hasFilters, pickMeal } from '@/lib/nutrition/filter';
import { useNutritionGuide } from '@/lib/nutrition/useNutritionGuide';
import { useNutritionPrefs } from '@/lib/stores/useNutritionPrefs';
import {
  Disclaimer,
  NutritionScreen,
  PHASE_TEXT,
  PhaseVisual,
  nutritionStyles as ns,
  prefsSummary,
} from '@/components/nutrition/NutritionParts';

function SaveStar({ saved, onPress, label }: { saved: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove from saved: ${label}` : `Save: ${label}`}
    >
      <Text style={[styles.star, saved && styles.starOn]}>{saved ? '★' : '☆'}</Text>
    </Pressable>
  );
}

export default function NutritionPhase() {
  const { phase: raw } = useLocalSearchParams<{ phase: string }>();
  const phase = (PHASE_ORDER as string[]).includes(raw ?? '') ? (raw as PhaseKey) : 'menstrual';

  const guide = useNutritionGuide();
  const p = guide.phases[phase];
  const prediction = usePrediction();
  const profile = useAppStore((s) => s.profile);
  const cycleLogs = useAppStore((s) => s.cycleLogs);
  const estimate = estimateNutritionPhase(prediction, phaseReliability(profile, cycleLogs));

  const diet = useNutritionPrefs((s) => s.diet);
  const allergies = useNutritionPrefs((s) => s.allergies);
  const avoid = useNutritionPrefs((s) => s.avoid);
  const saved = useNutritionPrefs((s) => s.saved);
  const toggleSaved = useNutritionPrefs((s) => s.toggleSaved);
  const prefs = { diet, allergies, avoid };
  const filtered = hasFilters(prefs);
  const isSaved = (id: string) => saved.some((t) => t.id === id);

  const foods = p.foods.map((g) => formatFoodGroup(g, prefs)).filter(Boolean) as { label: string; text: string }[];
  const meals = p.meals.map((m) => pickMeal(m, prefs));
  const accent = PHASE_TEXT[phase];
  const dot = phaseBanner[phase].accent;

  const idx = PHASE_ORDER.indexOf(phase);
  const prev = PHASE_ORDER[(idx + 3) % 4];
  const next = PHASE_ORDER[(idx + 1) % 4];
  const go = (k: PhaseKey) => router.replace(`/nutrition/${k}` as Href);

  const saveMeal = (slot: string, o: MealOption) =>
    toggleSaved({ id: o.id, phase, kind: 'meal', label: slot, text: o.text });

  return (
    <NutritionScreen title={p.name}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 12 }}>
          <PhaseVisual phase={phase} guide={p} size="hero" />
          <View style={{ gap: 4 }}>
            <Text style={[styles.kicker, { color: accent }]}>{p.label.toUpperCase()}</Text>
            <Text style={ns.title}>{p.name}</Text>
            <Text style={styles.timing}>
              <Text style={styles.timingWhen}>{p.when}</Text> · {p.timing}
            </Text>
            {estimate.phase === phase && (
              <View style={[ns.chip, { backgroundColor: phaseBanner[phase].bg, marginTop: 4 }]}>
                <Text style={[ns.chipText, { color: accent }]}>
                  {estimate.confidence === 'rough' ? 'ROUGH ESTIMATE OF YOUR PHASE' : 'YOUR ESTIMATED PHASE'}
                </Text>
              </View>
            )}
          </View>
          <Text style={ns.body}>{p.intro}</Text>
        </Animated.View>

        <View style={ns.card}>
          <Text style={ns.cardTitle}>Foods to add to your plate</Text>
          {foods.map((f) => (
            <View key={f.label} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: dot }]} />
              <Text style={styles.bulletText}>
                <Text style={styles.bulletLabel}>{f.label}: </Text>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={ns.card}>
          <Text style={ns.cardTitle}>Easy Indian meal ideas</Text>
          {meals.map((m) => (
            <View key={m.slot} style={styles.meal}>
              <Text style={[styles.mealSlot, { color: accent }]}>{m.slot.toUpperCase()}</Text>
              {m.main ? (
                <>
                  <View style={styles.mealRow}>
                    <Text style={styles.mealText}>{m.main.text}</Text>
                    <SaveStar saved={isSaved(m.main.id)} onPress={() => saveMeal(m.slot, m.main!)} label={m.main.text} />
                  </View>
                  {m.extra && (
                    <View style={styles.mealRow}>
                      <Text style={styles.mealAlt}>
                        <Text style={styles.mealAltLabel}>Or try: </Text>
                        {m.extra.text}
                      </Text>
                      <SaveStar saved={isSaved(m.extra.id)} onPress={() => saveMeal(m.slot, m.extra!)} label={m.extra.text} />
                    </View>
                  )}
                  {m.swapped && <Text style={ns.small}>Swapped to suit your preferences.</Text>}
                </>
              ) : (
                <Text style={ns.small}>None of our ideas fit your preferences here — choose a meal you enjoy that suits you.</Text>
              )}
            </View>
          ))}

          <View style={styles.prefsRow}>
            <Text style={[ns.small, { flex: 1 }]}>
              {filtered
                ? `Showing ideas for: ${prefsSummary(prefs)}. We can only filter what we know is in each idea — always check ingredients.`
                : 'Vegetarian, egg or non-veg? Allergies? Set your preferences to tailor these ideas.'}
            </Text>
            <Pressable onPress={() => router.push('/nutrition/preferences' as Href)} hitSlop={8}>
              <Text style={styles.prefsLink}>{filtered ? 'Edit' : 'Set'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[ns.card, { backgroundColor: phaseBanner[phase].bg, borderColor: 'transparent' }]}>
          <View style={styles.mealRow}>
            <Text style={[ns.cardTitle, { flex: 1 }]}>A little reminder from CycleAlign</Text>
            <SaveStar
              saved={isSaved(`${phase}:reminder`)}
              onPress={() => toggleSaved({ id: `${phase}:reminder`, phase, kind: 'reminder', label: '', text: p.reminder })}
              label="this reminder"
            />
          </View>
          <Text style={ns.body}>{p.reminder}</Text>
        </View>

        <View style={styles.nav}>
          <Pressable style={[ns.ghostBtn, styles.navBtn]} onPress={() => go(prev)}>
            <Text style={ns.ghostBtnText} numberOfLines={1}>‹ {guide.phases[prev].label.split(' — ')[0]}</Text>
          </Pressable>
          <Pressable style={[ns.ghostBtn, styles.navBtn]} onPress={() => go(next)}>
            <Text style={ns.ghostBtnText} numberOfLines={1}>{guide.phases[next].label.split(' — ')[0]} ›</Text>
          </Pressable>
        </View>

        <Disclaimer guide={guide} />
      </ScrollView>
    </NutritionScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  timing: { fontSize: 13.5, color: dash.inkSoft, lineHeight: 20 },
  timingWhen: { fontWeight: '700', color: dash.ink },

  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 14.5, color: dash.inkSoft, lineHeight: 22 },
  bulletLabel: { fontWeight: '700', color: dash.ink },

  meal: { gap: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: dash.line },
  mealSlot: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8, marginTop: 4 },
  mealRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mealText: { flex: 1, fontSize: 15, color: dash.ink, lineHeight: 22 },
  mealAlt: { flex: 1, fontSize: 14, color: dash.inkSoft, lineHeight: 21 },
  mealAltLabel: { fontWeight: '700', color: dash.inkSoft },
  star: { fontSize: 22, color: '#7A7268', lineHeight: 24 },
  starOn: { color: '#9C7424' },

  prefsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingTop: 8, borderTopWidth: 1, borderTopColor: dash.line },
  prefsLink: { fontSize: 13, fontWeight: '800', color: dash.sageDeep },

  nav: { flexDirection: 'row', gap: 10 },
  navBtn: { flex: 1, paddingHorizontal: 8 },
});

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dash, phaseBanner } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { PhaseKey } from '@/types/models';
import type { NutritionGuide, PhaseGuide } from '@/lib/nutrition/guide';
import type { FoodPrefs } from '@/lib/nutrition/filter';
import { ALLERGEN_LABELS } from '@/lib/nutrition/guide';

/**
 * Phase colours dark enough to read as text (WCAG AA ≥ 4.5:1 on white and on
 * the phase's own tint). The lighter `phaseBanner` accents stay for dots and borders.
 */
export const PHASE_TEXT: Record<PhaseKey, string> = {
  menstrual: '#A03D31',
  follicular: '#8C5A12',
  ovulation: '#466A2C',
  luteal: '#8C5A12',
};

export function NutritionScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10} accessibilityLabel="Back">
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.backBtn} />
      </View>
      {children}
    </SafeAreaView>
  );
}

/**
 * The phase's picture. Until the client supplies food photos this is a soft
 * illustration of the phase's foods; it carries the same alt text a photo would.
 */
export function PhaseVisual({ phase, guide, size = 'card' }: { phase: PhaseKey; guide: PhaseGuide; size?: 'card' | 'hero' }) {
  const hero = size === 'hero';
  return (
    <View
      style={[styles.visual, hero && styles.visualHero, { backgroundColor: phaseBanner[phase].bg }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={guide.imageAlt}
    >
      {guide.emoji.map((e, i) => (
        <Text key={i} style={[styles.visualEmoji, hero && styles.visualEmojiHero, i === 1 && styles.visualEmojiMid]}>
          {e}
        </Text>
      ))}
    </View>
  );
}

export function Disclaimer({ guide }: { guide: NutritionGuide }) {
  return (
    <View style={styles.disclaimer}>
      <Text style={styles.disclaimerCare}>{guide.careNote}</Text>
      <Text style={styles.disclaimerText}>{guide.disclaimer}</Text>
    </View>
  );
}

const DIET_LABEL = { vegetarian: 'Vegetarian', eggetarian: 'Eggetarian', nonvegetarian: 'Non-vegetarian' } as const;

/** "Vegetarian · No dairy, peanuts · Avoiding mushroom" — or null when nothing is set. */
export function prefsSummary(prefs: FoodPrefs): string | null {
  const parts: string[] = [];
  if (prefs.diet) parts.push(DIET_LABEL[prefs.diet]);
  if (prefs.allergies.length) {
    parts.push('No ' + prefs.allergies.map((a) => ALLERGEN_LABELS[a].split(' (')[0].toLowerCase()).join(', '));
  }
  if (prefs.avoid.length) parts.push('Avoiding ' + prefs.avoid.join(', '));
  return parts.length ? parts.join(' · ') : null;
}

export const nutritionStyles = StyleSheet.create({
  title: { fontFamily: fonts.headingBold, fontSize: 26, color: dash.ink, lineHeight: 32 },
  sub: { fontSize: 15, color: dash.inkSoft, lineHeight: 22, marginTop: 4 },
  card: { backgroundColor: dash.card, borderRadius: 22, padding: 18, gap: 10, borderWidth: 1, borderColor: dash.line },
  cardTitle: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink },
  body: { fontSize: 14.5, color: dash.inkSoft, lineHeight: 22 },
  small: { fontSize: 12.5, color: dash.inkSoft, lineHeight: 18 },
  sectionTitle: { fontFamily: fonts.headingBold, fontSize: 19, color: dash.ink },
  btn: { backgroundColor: dash.sageDeep, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  ghostBtn: { borderRadius: 14, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: dash.line, backgroundColor: dash.card },
  ghostBtnText: { color: dash.sageDeep, fontWeight: '800', fontSize: 14 },
  chip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.3 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dash.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: dash.line,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 28, color: dash.ink, marginTop: -2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: dash.ink },

  visual: { height: 92, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  visualHero: { height: 150, borderRadius: 22, gap: 14 },
  visualEmoji: { fontSize: 30 },
  visualEmojiHero: { fontSize: 46 },
  visualEmojiMid: { marginTop: -10 },

  disclaimer: { backgroundColor: '#F4F0EA', borderRadius: 18, padding: 16, gap: 8 },
  disclaimerCare: { fontSize: 13.5, color: dash.ink, lineHeight: 20, fontWeight: '600' },
  disclaimerText: { fontSize: 12.5, color: dash.inkSoft, lineHeight: 19 },
});

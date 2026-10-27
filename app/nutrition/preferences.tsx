import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { dash } from '@/theme';
import { ALLERGEN_LABELS, type Allergen, type DietPreference } from '@/lib/nutrition/guide';
import { useNutritionPrefs } from '@/lib/stores/useNutritionPrefs';
import { NutritionScreen, nutritionStyles as ns } from '@/components/nutrition/NutritionParts';

const DIETS: { value: DietPreference; label: string; hint: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', hint: 'No eggs, meat or fish' },
  { value: 'eggetarian', label: 'Eggetarian', hint: 'Vegetarian, plus eggs' },
  { value: 'nonvegetarian', label: 'Non-vegetarian', hint: 'Eggs, meat and fish too' },
  { value: null, label: 'Show me everything', hint: "Don't filter by diet" },
];

const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[];

export default function NutritionPreferences() {
  const diet = useNutritionPrefs((s) => s.diet);
  const allergies = useNutritionPrefs((s) => s.allergies);
  const avoid = useNutritionPrefs((s) => s.avoid);
  const setDiet = useNutritionPrefs((s) => s.setDiet);
  const toggleAllergy = useNutritionPrefs((s) => s.toggleAllergy);
  const setAvoid = useNutritionPrefs((s) => s.setAvoid);
  const [avoidText, setAvoidText] = useState(avoid.join(', '));

  const done = () => {
    setAvoid(avoidText.split(','));
    router.back();
  };

  return (
    <NutritionScreen title="Food preferences">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={ns.body}>
          We use these to filter the meal ideas in your food guide. They stay on this phone only.
        </Text>

        <View style={ns.card}>
          <Text style={ns.cardTitle}>What do you eat?</Text>
          {DIETS.map((d) => {
            const on = diet === d.value;
            return (
              <Pressable
                key={d.label}
                style={[styles.option, on && styles.optionOn]}
                onPress={() => setDiet(d.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{d.label}</Text>
                  <Text style={ns.small}>{d.hint}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={ns.card}>
          <Text style={ns.cardTitle}>Allergies or intolerances</Text>
          <Text style={ns.small}>We'll hide ideas that contain these.</Text>
          <View style={styles.chips}>
            {ALLERGENS.map((a) => {
              const on = allergies.includes(a);
              return (
                <Pressable
                  key={a}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggleAllergy(a)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{ALLERGEN_LABELS[a]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={ns.card}>
          <Text style={ns.cardTitle}>Foods you avoid</Text>
          <Text style={ns.small}>Separate with commas — for example: mushroom, brinjal, paneer</Text>
          <TextInput
            value={avoidText}
            onChangeText={setAvoidText}
            onEndEditing={() => setAvoid(avoidText.split(','))}
            placeholder="Type foods you'd rather skip"
            placeholderTextColor={dash.muted}
            style={styles.input}
            autoCapitalize="none"
            testID="nutrition-avoid"
          />
        </View>

        <Text style={ns.small}>
          Filters can only hide ingredients we know are in an idea. With a serious allergy, always check what's in your food.
        </Text>

        <Pressable style={ns.btn} onPress={done} testID="nutrition-prefs-done">
          <Text style={ns.btnText}>Done</Text>
        </Pressable>
      </ScrollView>
    </NutritionScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dash.line,
  },
  optionOn: { borderColor: dash.sage, backgroundColor: dash.sageTint },
  optionLabel: { fontSize: 15, fontWeight: '700', color: dash.ink },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: dash.muted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: dash.sage },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: dash.sage },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: dash.line, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: dash.card },
  chipOn: { borderColor: dash.clay, backgroundColor: dash.clayTint },
  chipText: { fontSize: 13, color: dash.inkSoft, fontWeight: '600' },
  chipTextOn: { color: dash.clay, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: dash.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: dash.ink,
    backgroundColor: dash.card,
  },
});

import type { PhaseKey } from '@/types/models';
import bundled from './guide.json';

/**
 * "Nutrition Guidance as per Your Cycle" — content model.
 *
 * The copy lives in guide.json (client brief, word for word, plus a few
 * allergy-friendly / non-veg alternatives marked `source: "added"` for the
 * dietitian to review). A newer copy can be published to the `app_content`
 * table (key `nutrition_guide`) and the app picks it up without a release.
 */

export type Allergen = 'dairy' | 'egg' | 'peanut' | 'treenut' | 'gluten' | 'soy' | 'sesame' | 'fish';

/** What a food needs you to eat: plain vegetarian, eggs, or meat/fish. */
export type FoodDiet = 'veg' | 'egg' | 'nonveg';

/** What she eats. `null` = not set, so nothing is hidden by diet. */
export type DietPreference = 'vegetarian' | 'eggetarian' | 'nonvegetarian' | null;

export interface FoodItem {
  name: string;
  contains?: Allergen[];
  diet?: FoodDiet;
}

export interface FoodGroup {
  label: string;
  joiner: 'and' | 'or';
  suffix?: string;
  items: FoodItem[];
}

export interface MealOption {
  id: string;
  text: string;
  contains?: Allergen[];
  diet: FoodDiet;
  source: 'brief' | 'added';
}

export interface MealSlot {
  slot: string;
  options: MealOption[];
}

export interface PhaseGuide {
  name: string;
  label: string;
  when: string;
  timing: string;
  emoji: string[];
  /** Food photo (Unsplash CDN); the emoji illustration shows while it loads or if it fails. */
  image?: string;
  imageAlt: string;
  intro: string;
  foods: FoodGroup[];
  meals: MealSlot[];
  reminder: string;
}

export interface NutritionGuide {
  version: number;
  title: string;
  intro: string;
  /** The core message: balanced, varied eating all month. Optional so older remote copies still load. */
  basics?: string;
  disclaimer: string;
  careNote: string;
  phases: Record<PhaseKey, PhaseGuide>;
}

export const PHASE_ORDER: PhaseKey[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  dairy: 'Dairy (milk, curd, paneer)',
  egg: 'Eggs',
  peanut: 'Peanuts',
  treenut: 'Tree nuts (almonds, walnuts…)',
  gluten: 'Gluten (wheat, oats)',
  soy: 'Soy (tofu)',
  sesame: 'Sesame & seeds',
  fish: 'Fish & seafood',
};

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Shape check for content that arrives from the database — anything malformed is ignored. */
export function isNutritionGuide(v: unknown): v is NutritionGuide {
  if (!v || typeof v !== 'object') return false;
  const g = v as Record<string, unknown>;
  if (typeof g.title !== 'string' || typeof g.intro !== 'string' || typeof g.disclaimer !== 'string') return false;
  if (typeof g.careNote !== 'string' || !g.phases || typeof g.phases !== 'object') return false;
  const phases = g.phases as Record<string, unknown>;
  return PHASE_ORDER.every((k) => {
    const p = phases[k] as Record<string, unknown> | undefined;
    if (!p) return false;
    const textFields = ['name', 'label', 'when', 'timing', 'imageAlt', 'intro', 'reminder'];
    if (!textFields.every((f) => typeof p[f] === 'string')) return false;
    if (!isStringArray(p.emoji) || !Array.isArray(p.foods) || !Array.isArray(p.meals)) return false;
    const foodsOk = (p.foods as Record<string, unknown>[]).every(
      (f) => typeof f.label === 'string' && Array.isArray(f.items) && (f.items as Record<string, unknown>[]).every((i) => typeof i.name === 'string'),
    );
    const mealsOk = (p.meals as Record<string, unknown>[]).every(
      (m) =>
        typeof m.slot === 'string' &&
        Array.isArray(m.options) &&
        (m.options as Record<string, unknown>[]).every((o) => typeof o.id === 'string' && typeof o.text === 'string'),
    );
    return foodsOk && mealsOk;
  });
}

export const BUNDLED_GUIDE = bundled as NutritionGuide;

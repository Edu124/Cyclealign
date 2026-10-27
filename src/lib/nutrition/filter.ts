import type { Allergen, DietPreference, FoodDiet, FoodGroup, FoodItem, MealOption, MealSlot } from './guide';

export interface FoodPrefs {
  diet: DietPreference;
  allergies: Allergen[];
  /** Foods she'd rather not eat, as she typed them ("mushroom", "brinjal"). */
  avoid: string[];
}

const DIET_ALLOWS: Record<Exclude<DietPreference, null>, FoodDiet[]> = {
  vegetarian: ['veg'],
  eggetarian: ['veg', 'egg'],
  nonvegetarian: ['veg', 'egg', 'nonveg'],
};

function dietOk(diet: FoodDiet | undefined, pref: DietPreference): boolean {
  if (!pref) return true;
  return DIET_ALLOWS[pref].includes(diet ?? 'veg');
}

/**
 * Whole-word, case-insensitive, singular or plural — "eggs" hides "egg curry"
 * and "tomato" hides "tomatoes", but "pea" doesn't hide "peanuts".
 */
export function mentions(text: string, word: string): boolean {
  const w = word.trim().toLowerCase();
  if (!w) return false;
  const stems = new Set([w]);
  if (w.length > 3 && w.endsWith('es')) stems.add(w.slice(0, -2));
  if (w.length > 3 && w.endsWith('s')) stems.add(w.slice(0, -1));
  const lower = text.toLowerCase();
  return [...stems].some((s) => {
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z])${escaped}(es|s)?(?![a-z])`).test(lower);
  });
}

/**
 * Safe to suggest? Unknown allergy info is treated as "contains": an item only
 * passes when none of her allergens is listed and none of her avoided foods is
 * named in it.
 */
export function allowed(
  item: { contains?: Allergen[]; diet?: FoodDiet; name?: string; text?: string },
  prefs: FoodPrefs,
): boolean {
  if (!dietOk(item.diet, prefs.diet)) return false;
  if ((item.contains ?? []).some((a) => prefs.allergies.includes(a))) return false;
  const label = item.text ?? item.name ?? '';
  return !prefs.avoid.some((w) => mentions(label, w));
}

/** "Label: a, b and c[ suffix]." — or null when every item was filtered out. */
export function formatFoodGroup(group: FoodGroup, prefs: FoodPrefs): { label: string; text: string } | null {
  const items = group.items.filter((i: FoodItem) => allowed(i, prefs)).map((i) => i.name);
  if (items.length === 0) return null;
  const list =
    items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} ${group.joiner} ${items[items.length - 1]}`;
  return { label: group.label, text: group.suffix ? `${list} ${group.suffix}.` : `${list}.` };
}

export interface MealPick {
  slot: string;
  /** The idea to show first: the brief's own meal when it fits, else the first alternative that does. */
  main: MealOption | null;
  /** For egg / non-veg eaters, one extra idea of that kind when there is one. */
  extra: MealOption | null;
  /** True when the brief's meal was swapped out because of her preferences. */
  swapped: boolean;
}

export function pickMeal(slot: MealSlot, prefs: FoodPrefs): MealPick {
  const fits = slot.options.filter((o) => allowed(o, prefs));
  const main = fits[0] ?? null;
  const wantsMore = prefs.diet === 'eggetarian' || prefs.diet === 'nonvegetarian';
  const extra = wantsMore ? fits.find((o) => o !== main && o.diet !== 'veg') ?? null : null;
  const swapped = !!main && main.source !== 'brief' && slot.options[0]?.source === 'brief';
  return { slot: slot.slot, main, extra, swapped };
}

export function hasFilters(prefs: FoodPrefs): boolean {
  return !!prefs.diet || prefs.allergies.length > 0 || prefs.avoid.length > 0;
}

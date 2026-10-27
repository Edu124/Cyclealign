import { BUNDLED_GUIDE, PHASE_ORDER, isNutritionGuide } from '../guide';
import { allowed, formatFoodGroup, mentions, pickMeal, type FoodPrefs } from '../filter';
import { estimateNutritionPhase } from '../estimate';
import type { Prediction } from '@/types/models';

const none: FoodPrefs = { diet: null, allergies: [], avoid: [] };
const g = BUNDLED_GUIDE;

describe('bundled nutrition guide', () => {
  it('is well-formed and has all four phases with the brief\'s copy', () => {
    expect(isNutritionGuide(g)).toBe(true);
    expect(g.phases.menstrual.label).toBe('Menstrual — Nourish & restore');
    expect(g.phases.follicular.label).toBe('Follicular — Build balanced habits');
    expect(g.phases.ovulation.label).toBe('Ovulation — Keep it varied');
    expect(g.phases.luteal.label).toBe('Luteal — Stay nourished');
    for (const k of PHASE_ORDER) {
      expect(g.phases[k].meals.map((m) => m.slot)).toEqual(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
      // The brief's own meal leads every slot.
      for (const m of g.phases[k].meals) expect(m.options[0].source).toBe('brief');
    }
  });

  it('meal ids are unique (saved tips key on them)', () => {
    const ids = PHASE_ORDER.flatMap((k) => g.phases[k].meals.flatMap((m) => m.options.map((o) => o.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects malformed remote content', () => {
    expect(isNutritionGuide(null)).toBe(false);
    expect(isNutritionGuide({ ...g, phases: { ...g.phases, luteal: undefined } })).toBe(false);
  });
});

describe('preferences filter', () => {
  it('shows the brief\'s meals when nothing is set', () => {
    const pick = pickMeal(g.phases.menstrual.meals[0], none);
    expect(pick.main?.text).toBe('Vegetable poha with peanuts');
    expect(pick.extra).toBeNull();
    expect(pick.swapped).toBe(false);
  });

  it('swaps out a meal containing an allergen', () => {
    const pick = pickMeal(g.phases.menstrual.meals[0], { ...none, allergies: ['peanut'] });
    expect(pick.main?.text).not.toMatch(/peanut/i);
    expect(pick.swapped).toBe(true);
  });

  it('never shows eggs, meat or fish to a vegetarian', () => {
    const veg: FoodPrefs = { ...none, diet: 'vegetarian' };
    for (const k of PHASE_ORDER) {
      for (const m of g.phases[k].meals) {
        const pick = pickMeal(m, veg);
        expect(pick.main?.diet ?? 'veg').toBe('veg');
        expect(pick.extra).toBeNull();
      }
    }
    // Ovulation breakfast in the brief includes an omelette, so it is swapped.
    expect(pickMeal(g.phases.ovulation.meals[0], veg).main?.text).toBe('Paneer bhurji with roti');
  });

  it('offers a non-veg idea alongside the brief\'s meal for non-vegetarians', () => {
    const pick = pickMeal(g.phases.menstrual.meals[1], { ...none, diet: 'nonvegetarian' });
    expect(pick.main?.text).toBe('Dal, roti, sabzi and lemon');
    expect(pick.extra?.diet).toBe('nonveg');
  });

  it('hides foods she avoids by name, as whole words', () => {
    expect(mentions('Vegetable khichdi with paneer or tofu', 'paneer')).toBe(true);
    expect(mentions('Vegetable poha with peanuts', 'pea')).toBe(false);
    expect(mentions('Egg curry with rice', 'eggs')).toBe(true);
    expect(mentions('carrots, capsicum, tomatoes', 'Tomato')).toBe(true);
    expect(mentions('A boiled egg', 'egg')).toBe(true);
    const pick = pickMeal(g.phases.luteal.meals[3], { ...none, avoid: ['paneer'] });
    expect(pick.main?.text).not.toMatch(/paneer/i);
  });

  it('treats unknown allergy info as unsafe only when an allergen is listed', () => {
    expect(allowed({ text: 'Moong dal chilla' }, { ...none, allergies: ['dairy'] })).toBe(true);
    expect(allowed({ text: 'Curd', contains: ['dairy'] }, { ...none, allergies: ['dairy'] })).toBe(false);
  });

  it('rebuilds a food list without the filtered items', () => {
    const protein = g.phases.menstrual.foods[2];
    expect(formatFoodGroup(protein, none)?.text).toBe('paneer, eggs, tofu, curd or lentils.');
    expect(formatFoodGroup(protein, { ...none, allergies: ['dairy'], diet: 'vegetarian' })?.text).toBe('tofu or lentils.');
    const vitC = g.phases.menstrual.foods[1];
    expect(formatFoodGroup(vitC, none)?.text).toBe(
      'amla, guava, oranges and lemon to help your body absorb iron from plant foods.',
    );
  });
});

describe('phase estimate', () => {
  const pred = (over: Partial<Prediction> = {}): Prediction =>
    ({ currentPhase: 'luteal', isOverdue: false, dayOfCycle: 20, cycleLength: 28, ...over }) as Prediction;

  it('is labelled as an estimate for regular logs', () => {
    const e = estimateNutritionPhase(pred(), 'reliable');
    expect(e.phase).toBe('luteal');
    expect(e.confidence).toBe('estimate');
    expect(e.note).toMatch(/estimated/i);
  });

  it('never presents ovulation as confirmed', () => {
    expect(estimateNutritionPhase(pred({ currentPhase: 'ovulation' }), 'reliable').note).toMatch(/can't confirm ovulation/);
  });

  it('makes no claim without logs or for irregular cycles', () => {
    expect(estimateNutritionPhase(null, 'reliable').phase).toBeNull();
    expect(estimateNutritionPhase(pred(), 'none').phase).toBeNull();
  });

  it('is only a rough estimate when cycles vary or a period may be due', () => {
    expect(estimateNutritionPhase(pred(), 'partial').confidence).toBe('rough');
    expect(estimateNutritionPhase(pred({ isOverdue: true }), 'reliable').confidence).toBe('rough');
  });
});

import { PhaseKey } from '@/types/models';

export interface PhaseTips {
  summary: string;
  diet: string;
  mood: string;
  energy: string;
  movement: string;
}

/**
 * Rule-based, non-clinical wellness tips per phase. Kept deliberately separate
 * from the UI so a future hosted-LLM `InsightsProvider` can replace this without
 * touching screens.
 */
const TIPS: Record<PhaseKey, PhaseTips> = {
  menstrual: {
    summary:
      'Your body is shedding the uterine lining. Energy is naturally lower — permission to slow down.',
    diet: 'Iron-rich foods (leafy greens, lentils, dark chocolate) and warm, comforting meals.',
    mood: 'Introspective and tender. A good time to reflect and journal.',
    energy: 'Lowest of the cycle — rest is productive right now.',
    movement: 'Gentle walks, restorative yoga, light stretching.',
  },
  follicular: {
    summary:
      'Estrogen is climbing. You may feel fresh, curious and motivated — a great time to start things.',
    diet: 'Fresh, light foods, lean protein and fermented foods to support rising energy.',
    mood: 'Optimistic and social. Brainstorm, plan and connect.',
    energy: 'Rising steadily — momentum builds day by day.',
    movement: 'Try something new: cardio, dance, a challenging class.',
  },
  ovulation: {
    summary:
      'Estrogen peaks and you release an egg. Confidence, energy and libido are often at their highest.',
    diet: 'Antioxidant-rich fruits and veg, fibre and plenty of water.',
    mood: 'Outgoing and magnetic — lean into conversations and visibility.',
    energy: 'Peak energy — your strongest window of the month.',
    movement: 'High-intensity workouts, strength training, group sport.',
  },
  luteal: {
    summary:
      'Progesterone rises then falls. Energy winds down and PMS may appear in the final days — be gentle.',
    diet: 'Complex carbs, magnesium (nuts, seeds, banana) and limit salt & caffeine.',
    mood: 'More inward and sensitive. Protect your calm and your boundaries.',
    energy: 'Tapering — pace yourself and prioritise sleep.',
    movement: 'Pilates, moderate strength, walking — lower the intensity gradually.',
  },
};

export function tipsForPhase(phase: PhaseKey): PhaseTips {
  return TIPS[phase];
}

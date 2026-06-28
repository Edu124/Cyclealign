import { palette } from '@/theme';

export interface OrbColors {
  light: string;
  base: string;
  dark: string;
}

export interface FeatureOrb {
  key: string;
  label: string;
  emoji: string;
  colors: OrbColors;
  title: string;
  body: string;
  /** Short, supportive takeaways shown as bullets in the reveal card. */
  points: string[];
}

/**
 * The interactive "Explore" orbs. Each is a glossy 3D ball the user can tap to
 * learn what a feature means — a calm, tactile way to discover the app without
 * walls of text. Content is supportive and non-clinical.
 */
export const FEATURE_ORBS: FeatureOrb[] = [
  {
    key: 'cycle',
    label: 'Your Cycle',
    emoji: '🌙',
    colors: { light: '#D9CFF7', base: palette.lavender, dark: palette.lavenderDeep },
    title: 'Your cycle, day by day',
    body: 'The ring on your home screen shows exactly where you are in your cycle today, counting gently from your last period.',
    points: [
      'Day 1 is the first day of your period',
      'The glowing marker is today',
      'It updates automatically every day',
    ],
  },
  {
    key: 'fertility',
    label: 'Fertility',
    emoji: '🌸',
    colors: { light: '#FBD7E6', base: palette.rose, dark: palette.roseDeep },
    title: 'Your fertile window',
    body: 'We estimate the days around ovulation when conception is most likely — useful whether you are planning or simply staying informed.',
    points: [
      'Ovulation is ~14 days before your next period',
      'The fertile window spans ~6 days',
      'Estimates sharpen as you log more cycles',
    ],
  },
  {
    key: 'phases',
    label: 'Phases',
    emoji: '🌿',
    colors: { light: '#CFEEE8', base: palette.teal, dark: palette.tealDeep },
    title: 'Four phases, one rhythm',
    body: 'Your cycle moves through four phases. Each brings shifts in energy and mood — knowing yours helps you work with your body, not against it.',
    points: [
      'Menstrual · Follicular · Ovulation · Luteal',
      'See your current phase any time',
      'Tap a phase for what to expect',
    ],
  },
  {
    key: 'selfcare',
    label: 'Self-care',
    emoji: '💗',
    colors: { light: '#E9DCF9', base: '#C3B0F0', dark: palette.lavenderDeep },
    title: 'Gentle, timely guidance',
    body: 'Each phase comes with kind suggestions for food, movement and rest — small nudges to help you feel your best, right on time.',
    points: [
      'Personalised to your current phase',
      'Nourish, mood, energy and movement',
      'Always supportive, never clinical',
    ],
  },
];

export interface Mood {
  key: string;
  emoji: string;
  label: string;
  color: string;
  /** Supportive recommendation shown after the user taps this mood. */
  recommendation: {
    title: string;
    body: string;
    actions: string[];
  };
}

/**
 * Daily feelings the user can log. Each maps to a kind, non-clinical
 * recommendation to help them feel a little better. A future LLM
 * `InsightsProvider` can personalise these further using cycle context.
 */
export const MOODS: Mood[] = [
  {
    key: 'great',
    emoji: '😄',
    label: 'Great',
    color: '#5BBEAF',
    recommendation: {
      title: 'Ride the wave 🌊',
      body: 'You\'re feeling good — a perfect day to channel that energy into something meaningful.',
      actions: [
        'Tackle a task you\'ve been putting off',
        'Move your body while it feels easy',
        'Note what made today good, for harder days',
      ],
    },
  },
  {
    key: 'calm',
    emoji: '😌',
    label: 'Calm',
    color: '#8FD9CE',
    recommendation: {
      title: 'Savour the stillness 🍃',
      body: 'Calm is a gift. Protect it and let yourself simply be.',
      actions: [
        'Take three slow, deep breaths',
        'Step outside for a few quiet minutes',
        'Do one thing slowly and fully present',
      ],
    },
  },
  {
    key: 'tired',
    emoji: '😴',
    label: 'Tired',
    color: '#B9A7F0',
    recommendation: {
      title: 'Be gentle with yourself 💤',
      body: 'Low energy is your body asking for care, not a failing. Rest is productive.',
      actions: [
        'Hydrate and have an iron-rich snack',
        'Aim for an earlier night tonight',
        'Lower the bar — do less, kindly',
      ],
    },
  },
  {
    key: 'crampy',
    emoji: '😣',
    label: 'Crampy',
    color: '#F4A8C4',
    recommendation: {
      title: 'Soothe the ache 🌡️',
      body: 'Cramps are common — a few comforts can take the edge off.',
      actions: [
        'Warm compress or hot water bottle on your tummy',
        'Gentle stretching or a slow walk',
        'Magnesium-rich foods; ease off caffeine',
      ],
    },
  },
  {
    key: 'anxious',
    emoji: '😟',
    label: 'Anxious',
    color: '#C3B0F0',
    recommendation: {
      title: 'Find your ground 🤍',
      body: 'Anxiety can rise before your period. Let\'s slow the spin a little.',
      actions: [
        'Try the 4-7-8 breath, twice',
        'Name 5 things you can see right now',
        'Write the worry down to get it out of your head',
      ],
    },
  },
  {
    key: 'low',
    emoji: '😢',
    label: 'Low',
    color: '#9AB0E0',
    recommendation: {
      title: 'You\'re not alone 💗',
      body: 'Feeling low is valid. Small kindnesses count today.',
      actions: [
        'Message someone who feels safe',
        'Get a little sunlight if you can',
        'Be as kind to yourself as you\'d be to a friend',
      ],
    },
  },
  {
    key: 'irritable',
    emoji: '😤',
    label: 'Irritable',
    color: '#E8839B',
    recommendation: {
      title: 'Make space 🌬️',
      body: 'Irritability often spikes in the luteal phase. A pause helps.',
      actions: [
        'Step away for 10 minutes before reacting',
        'Move the energy out with a brisk walk',
        'Protect your boundaries — it\'s okay to say no',
      ],
    },
  },
  {
    key: 'energetic',
    emoji: '⚡',
    label: 'Energetic',
    color: '#F0C36D',
    recommendation: {
      title: 'Put it to good use ✨',
      body: 'Great energy — often around ovulation. Make the most of it.',
      actions: [
        'Schedule the bold conversation or workout',
        'Start the project you\'ve been excited about',
        'Connect — you\'re likely feeling social',
      ],
    },
  },
];

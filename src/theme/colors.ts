/**
 * CycleAlign palette — warm, earthy "wellness" scheme.
 * Cream background · sage-green primary · terracotta/peach accent · charcoal text.
 *
 * NOTE: the historical key names (lavender / rose / teal) are kept so the whole
 * app keeps referencing them, but their VALUES now hold the earthy palette:
 *   lavender* = sage green (primary)
 *   rose*     = terracotta / peach (accent)
 *   teal*     = eucalyptus (tertiary)
 */

export const palette = {
  // Primary — sage green
  lavender: '#A8C293',
  lavenderDeep: '#5F7D4B',
  // Accent — terracotta / peach
  rose: '#ECB59C',
  roseDeep: '#C06A45',
  // Tertiary — eucalyptus
  teal: '#9AC3B0',
  tealDeep: '#5C8B74',
  // Soft peach card tint
  blush: '#FBEDE4',

  // Neutrals (warm)
  ink: '#2F2A25', // headings — warm charcoal
  inkSoft: '#6B635A',
  muted: '#A79E93',
  line: '#ECE4D9',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF7F1',
  bg: '#F7F4EF',

  // Phase colors — match the intro animation pills
  menstrual: '#E8748A',
  follicular: '#8B7EC8',
  ovulation: '#F5A623',
  luteal: '#68C4B0',

  // Status
  success: '#5C8B74',
  warning: '#E6B079',
  danger: '#C9695A',
  white: '#FFFFFF',
} as const;

export const gradients = {
  // Primary CTA — sage button
  brand: ['#9DBE84', '#7E9F6A', '#5F7D4B'] as const,
  brandSoft: ['#D4E2C5', '#F4DCCB', '#EFE6D5'] as const,
  // Whole-app background — warm cream, barely there
  screen: ['#F7F4EF', '#FAF1EA', '#F3F5EE'] as const,
  glow: ['#CFE0BD', '#F2D5C2', '#E8D9BF'] as const,
  // Logo ring — sage -> terracotta -> amber
  ring: ['#5F7D4B', '#C06A45', '#E0A06A'] as const,
} as const;

/**
 * Reference-dashboard tokens — the exact warm-white + sage/clay system from the
 * provided design mock. Kept separate so the dashboard matches the reference
 * precisely without disturbing the rest of the palette.
 */
export const dash = {
  bg: '#FAF8F4',
  card: '#FFFFFF',
  sage: '#6E8B5E',
  sageDeep: '#56723F',
  sageTint: '#E9EFE2',
  clay: '#C2683F',
  clayTint: '#F7E7DB',
  cycleCard: '#FBEFE7',
  insight: '#E7EEE0',
  ink: '#2E2A26',
  inkSoft: '#6E665E',
  muted: '#A79E93',
  line: '#EFEAE2',
  water: '#5C9A8B',
} as const;

export const phaseColors = {
  menstrual:  { base: palette.menstrual,  deep: '#C54D66' },
  follicular: { base: palette.follicular, deep: '#6558A8' },
  ovulation:  { base: palette.ovulation,  deep: '#D4850A' },
  luteal:     { base: palette.luteal,     deep: '#419E8C' },
} as const;

/**
 * Phase Banner background tokens (Component A). PLACEHOLDER values — pending the
 * final brand hex from Vinnie. One per biological phase.
 */
export const phaseBanner = {
  menstrual:  { bg: '#FCE8ED', accent: '#C54D66' },
  follicular: { bg: '#EEE9F8', accent: '#6558A8' },
  ovulation:  { bg: '#FEF4E0', accent: '#D4850A' },
  luteal:     { bg: '#E3F6F2', accent: '#419E8C' },
} as const;

/** Capacity (Component B) colours. */
export const capacityColors = {
  HIGH: { fg: '#56723F', bg: '#E8EFE1' },
  MEDIUM: { fg: '#B07A2E', bg: '#F6E9D4' },
  LOW: { fg: '#B85F3C', bg: '#F7E3D9' },
} as const;

export type Palette = typeof palette;

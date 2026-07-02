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

  // Phase colors — client's traffic-light system: red = rest, amber =
  // transition, green = peak. Follicular and luteal intentionally share amber.
  menstrual: '#D95F52',   // red
  follicular: '#EDA639',  // amber
  ovulation: '#7FAA5A',   // green
  luteal: '#EDA639',      // amber

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
  menstrual:  { base: palette.menstrual,  deep: '#B04437' },
  follicular: { base: palette.follicular, deep: '#C1801E' },
  ovulation:  { base: palette.ovulation,  deep: '#557E38' },
  luteal:     { base: palette.luteal,     deep: '#C1801E' },
} as const;

/**
 * Phase Banner background tokens (Component A) — soft tints of the
 * red/amber/green traffic-light phase system.
 */
export const phaseBanner = {
  menstrual:  { bg: '#FBE9E6', accent: '#B04437' },
  follicular: { bg: '#FBF0DC', accent: '#C1801E' },
  ovulation:  { bg: '#EBF2E2', accent: '#557E38' },
  luteal:     { bg: '#FBF0DC', accent: '#C1801E' },
} as const;

/** Capacity (Component B) colours. */
export const capacityColors = {
  HIGH: { fg: '#56723F', bg: '#E8EFE1' },
  MEDIUM: { fg: '#B07A2E', bg: '#F6E9D4' },
  LOW: { fg: '#B85F3C', bg: '#F7E3D9' },
} as const;

export type Palette = typeof palette;

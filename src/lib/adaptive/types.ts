import type { CycleRegularity, HealthContext } from '@/types/models';

export type { CycleRegularity, HealthContext };

/** Which engine drives recommendations for this user. */
export type AdaptiveMode = 'regular' | 'pcos_irregular' | 'perimenopause';

export type ReadinessLevel = 'STRONG' | 'GOOD' | 'NEUTRAL' | 'PROTECT' | 'INSUFFICIENT_DATA';

export type ReadinessType =
  | 'DECISION'
  | 'FOCUS'
  | 'CREATIVE'
  | 'COMMUNICATION'
  | 'SOCIAL'
  | 'RECOVERY';

export type Confidence = 'low' | 'medium' | 'high';

export interface Readiness {
  level: ReadinessLevel;
  /** 0..1, internal only — the UI never shows a number or a medical score. */
  score: number | null;
  confidence: Confidence;
  /** Plain-language "why", at most three. */
  reasons: string[];
  /** Which inputs were actually used (for transparency / the decision_window record). */
  sources: string[];
}

export const LEVEL_LABEL: Record<ReadinessLevel, string> = {
  STRONG: 'Strong',
  GOOD: 'Good',
  NEUTRAL: 'Neutral',
  PROTECT: 'Protect / flex if possible',
  INSUFFICIENT_DATA: 'Still learning',
};

export const READINESS_TYPE_LABEL: Record<ReadinessType, string> = {
  DECISION: 'Decision Window',
  FOCUS: 'High Focus Window',
  CREATIVE: 'Creative Window',
  COMMUNICATION: 'High Communication Window',
  SOCIAL: 'Social Window',
  RECOVERY: 'Low-capacity window',
};

export interface SymptomOption {
  id: string;
  label: string;
  /** Worth a neutral "talk to a clinician" nudge when it keeps being reported. */
  flag?: boolean;
  /** Extra options shown for the perimenopause mode. */
  perimenopause?: boolean;
}

/** User-reported symptoms. Never described as caused by hormones. */
export const SYMPTOMS: SymptomOption[] = [
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'cramps', label: 'Cramps' },
  { id: 'headache', label: 'Headache' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'brain_fog', label: 'Brain fog' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'hot_flashes', label: 'Hot flashes', perimenopause: true },
  { id: 'night_sweats', label: 'Night sweats', perimenopause: true },
  { id: 'night_waking', label: 'Night waking', perimenopause: true },
  { id: 'joint_aches', label: 'Joint aches', perimenopause: true },
  { id: 'heavy_bleeding', label: 'Heavy bleeding', flag: true },
  { id: 'severe_pain', label: 'Severe pain', flag: true },
];

export const BLEEDING_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
] as const;

import { create } from 'zustand';
import type { CycleRegularity, Gender, HealthContext } from '@/types/models';

export interface OnboardingDraft {
  role: string | null;
  name: string;
  gender: Gender | null;
  birthDate: string | null; // ISO date yyyy-mm-dd
  lastPeriodStart: string | null;
  avgCycleLength: number;
  avgPeriodLength: number;
  /** True when user picked "I don't know" — defaults to 28 days, flags for recalibration. */
  unknownCycleLength: boolean;
  notificationEnabled: boolean;
  /** Optional personalisation answers (user-provided context, not a diagnosis). */
  cycleRegularity: CycleRegularity | null;
  healthContext: HealthContext | null;
  cycleLengthRange: string | null;
}

interface OnboardingState extends OnboardingDraft {
  set: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

const initial: OnboardingDraft = {
  role: null,
  name: '',
  gender: null,
  birthDate: null,
  lastPeriodStart: null,
  avgCycleLength: 28,
  avgPeriodLength: 5,
  unknownCycleLength: false,
  notificationEnabled: false,
  cycleRegularity: null,
  healthContext: null,
  cycleLengthRange: null,
};

export const useOnboarding = create<OnboardingState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));

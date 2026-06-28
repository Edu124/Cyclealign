import { create } from 'zustand';
import type { Gender } from '@/types/models';

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
};

export const useOnboarding = create<OnboardingState>((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));

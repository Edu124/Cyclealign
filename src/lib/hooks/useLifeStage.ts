import { useAppStore } from '@/lib/stores/useAppStore';
import { lifeStageFor, type LifeStage } from '@/lib/intelligence/lifeStage';

/**
 * The user's current age + hormonal life stage, derived from the profile's
 * birth date at render time — so recommendations advance automatically when
 * her age (and therefore stage) changes. Null when no birthday is on file.
 */
export function useLifeStage(): { age: number; stage: LifeStage } | null {
  const birthDate = useAppStore((s) => s.profile?.birthDate);
  return lifeStageFor(birthDate);
}

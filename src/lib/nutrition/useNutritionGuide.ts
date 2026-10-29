import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { BUNDLED_GUIDE, isNutritionGuide, type NutritionGuide } from './guide';

let cached: NutritionGuide | null = null;

/**
 * The bundled guide straight away, swapped for the copy in `app_content`
 * (key `nutrition_guide`) when one is published and well-formed. A missing
 * table, a network error or a malformed edit all fall back to the bundled copy.
 */
export function useNutritionGuide(): NutritionGuide {
  const [guide, setGuide] = useState<NutritionGuide>(cached ?? BUNDLED_GUIDE);

  useEffect(() => {
    if (cached || !isSupabaseConfigured) return;
    let alive = true;
    supabase
      .from('app_content')
      .select('data')
      .eq('key', 'nutrition_guide')
      .maybeSingle()
      .then(({ data }) => {
        const remote = (data as { data?: unknown } | null)?.data;
        if (!isNutritionGuide(remote)) return;
        // A copy saved before photos were added keeps the app's photo for each phase.
        const merged: NutritionGuide = {
          ...remote,
          phases: Object.fromEntries(
            Object.entries(remote.phases).map(([k, p]) => [
              k,
              { ...p, image: p.image ?? BUNDLED_GUIDE.phases[k as keyof NutritionGuide['phases']].image },
            ]),
          ) as NutritionGuide['phases'],
        };
        cached = merged;
        if (alive) setGuide(merged);
      }, () => {});
    return () => {
      alive = false;
    };
  }, []);

  return guide;
}

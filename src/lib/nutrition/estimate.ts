import type { PhaseKey, Prediction } from '@/types/models';
import type { PhaseReliability } from '@/lib/adaptive/mode';

export interface PhaseEstimate {
  /** null = we don't make a claim; she browses the four phases herself. */
  phase: PhaseKey | null;
  /** 'estimate' = from regular logs; 'rough' = logs vary or a period may be due. */
  confidence: 'estimate' | 'rough' | null;
  /** One short line explaining the estimate, or why there isn't one. */
  note: string;
}

/**
 * The phase to highlight in the food guide. Always worded as an estimate from
 * logged dates — it never confirms ovulation — and it stays silent when the
 * data can't support a claim (no logs, irregular / changing cycles).
 */
export function estimateNutritionPhase(
  prediction: Prediction | null,
  reliability: PhaseReliability,
): PhaseEstimate {
  if (!prediction) {
    return { phase: null, confidence: null, note: 'Log your period to see an estimate. Until then, pick the phase that fits.' };
  }
  if (reliability === 'none') {
    return {
      phase: null,
      confidence: null,
      note: "Your cycle varies, so we won't guess your phase. Pick the one that feels closest.",
    };
  }
  // Dates alone can't confirm ovulation — say so whenever that's the estimate.
  const ovulationCaveat = prediction.currentPhase === 'ovulation' ? " Dates alone can't confirm ovulation." : '';
  if (prediction.isOverdue) {
    return {
      phase: prediction.currentPhase,
      confidence: 'rough',
      note: 'Your period may be due, so this estimate may be off. Log it when it starts.' + ovulationCaveat,
    };
  }
  if (reliability === 'partial') {
    return {
      phase: prediction.currentPhase,
      confidence: 'rough',
      note: 'Your cycle length varies, so this is a rough estimate from your logged dates.' + ovulationCaveat,
    };
  }
  return {
    phase: prediction.currentPhase,
    confidence: 'estimate',
    note: 'Estimated from your logged period dates. Timing varies from cycle to cycle.' + ovulationCaveat,
  };
}

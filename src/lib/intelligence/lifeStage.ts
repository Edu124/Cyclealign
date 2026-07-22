/**
 * Age-based hormonal life stages.
 *
 * Grounded in the STRAW+10 reproductive-aging framework (Harlow et al. 2012)
 * and SWAN-study findings on mood across the menopausal transition. Ages are
 * typical ranges, not diagnoses — STRAW itself stages by cycle characteristics
 * and hormones, not age — so all copy stays educational and non-clinical, and
 * nudges toward a clinician where that matters.
 */

export interface LifeStage {
  id: 'foundation' | 'peak' | 'shifting' | 'transition' | 'newBalance';
  label: string;
  emoji: string;
  /** Typical age band used for assignment. */
  minAge: number;
  maxAge: number; // inclusive
  /** One-line what-this-stage-is. */
  summary: string;
  /** How mood/emotion commonly behaves in this stage. */
  moodNote: string;
  /** Actionable, stage-tuned recommendations. */
  tips: string[];
  /** Compact context string injected into the AI coach's system prompt. */
  coachContext: string;
}

export const LIFE_STAGES: LifeStage[] = [
  {
    id: 'foundation',
    label: 'Foundation Years',
    emoji: '🌱',
    minAge: 0,
    maxAge: 19,
    summary:
      'Cycles are still finding their rhythm — irregularity is common and usually normal in the first years after periods begin.',
    moodNote:
      'Hormone swings can feel stronger while cycles settle; mood dips around your period are common and usually pass.',
    tips: [
      'Track consistently — your personal pattern is still forming, and data now pays off later.',
      'Prioritise sleep and iron-rich foods; both smooth out energy dips.',
      'Very heavy or very painful periods are worth mentioning to a doctor — not something to just endure.',
    ],
    coachContext:
      'She is in her teens (foundation stage): cycles may still be irregular, which is usually normal; be reassuring, never alarmist, and encourage tracking habits.',
  },
  {
    id: 'peak',
    label: 'Peak Rhythm',
    emoji: '🌿',
    minAge: 20,
    maxAge: 34,
    summary:
      'The most predictable cycle years for most women — phase patterns are strongest and easiest to plan around.',
    moodNote:
      'Mood tends to follow the classic phase pattern: rising energy to ovulation, a steadier-then-softer luteal tail, brief menstrual dip.',
    tips: [
      'Lean into phase planning — deep work in follicular, big conversations near ovulation, admin in luteal.',
      'Your cycle is a monthly health report: notable changes in regularity are worth tracking.',
      'Build the habits now (sleep, strength training, stress outlets) that later stages will thank you for.',
    ],
    coachContext:
      'She is in her prime reproductive years (peak stage): cycles are typically regular; lean into classic phase-based planning advice.',
  },
  {
    id: 'shifting',
    label: 'Shifting Rhythm',
    emoji: '🍃',
    minAge: 35,
    maxAge: 44,
    summary:
      'The late reproductive stage — cycles often shorten subtly and PMS can intensify as hormone levels begin a slow shift.',
    moodNote:
      'Many women notice stronger premenstrual mood signals than in their twenties; the luteal phase deserves extra gentleness.',
    tips: [
      'Re-tune your planning: if your cycle has shortened, your best-energy window may arrive earlier than it used to.',
      'Guard sleep fiercely in the luteal phase — it amplifies or absorbs most other symptoms.',
      'Strength training and protein matter more each year from here — they protect energy, bone and mood.',
    ],
    coachContext:
      'She is in the late reproductive stage (35-44): cycles may shorten and PMS may intensify; validate changes as common, suggest gentle adjustments, and recommend a clinician for marked changes.',
  },
  {
    id: 'transition',
    label: 'The Transition',
    emoji: '🌤️',
    minAge: 45,
    maxAge: 54,
    summary:
      'The typical perimenopause window — cycle length can vary widely, and skipped periods become common as hormones fluctuate.',
    moodNote:
      'Mood swings, anxiety and low days are more common in this stage than any other — a finding confirmed by long-term studies. It is hormonal, real, and manageable; you are not imagining it.',
    tips: [
      'Expect irregularity — plan by how you feel each day (your logs) more than by textbook phase dates.',
      'Sleep disruption drives many symptoms here; treat wind-down routines as non-negotiable.',
      'A doctor who listens is a power move in this stage — symptom treatments exist and work. Persistent low mood deserves professional support.',
    ],
    coachContext:
      'She is in the typical perimenopause window (45-54): cycles may be irregular, and mood symptoms are commonly elevated in this stage; be extra validating, trust her daily logs over textbook phases, and readily suggest talking to a doctor about persistent symptoms.',
  },
  {
    id: 'newBalance',
    label: 'New Balance',
    emoji: '☀️',
    minAge: 55,
    maxAge: 200,
    summary:
      'Post-menopause for most women — monthly cycling gives way to steadier hormones and a new, more even energy baseline.',
    moodNote:
      'Day-to-day mood is typically steadier than in the transition years; energy responds most to sleep, movement and connection now.',
    tips: [
      'Daily rhythm replaces monthly rhythm — consistent sleep and movement become your energy levers.',
      'Strength training and calcium/vitamin D are front-line care for bone and mood.',
      'Any new bleeding after a year without periods should be checked by a doctor promptly.',
    ],
    coachContext:
      'She is likely post-menopausal (55+): monthly cycle advice applies less; focus on daily rhythms, sleep, strength and wellbeing. Any post-menopausal bleeding warrants a doctor visit.',
  },
];

/** Whole-year age from an ISO birth date, or null if absent/invalid. */
export function ageFrom(birthDateISO: string | null | undefined, today: Date = new Date()): number | null {
  if (!birthDateISO) return null;
  const b = new Date(birthDateISO + 'T00:00:00');
  if (isNaN(b.getTime())) return null;
  let age = today.getFullYear() - b.getFullYear();
  const beforeBirthday =
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Stage for an ISO birth date — recomputed from "today", so it advances automatically as the user ages. */
export function lifeStageFor(
  birthDateISO: string | null | undefined,
  today: Date = new Date(),
): { age: number; stage: LifeStage } | null {
  const age = ageFrom(birthDateISO, today);
  if (age === null) return null;
  const stage = LIFE_STAGES.find((s) => age >= s.minAge && age <= s.maxAge);
  return stage ? { age, stage } : null;
}

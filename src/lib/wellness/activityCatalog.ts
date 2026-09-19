import type { PhaseKey } from '@/types/models';

export type ActivityCategory = 'exercise' | 'mindfulness' | 'quick';

export interface Activity {
  id: string;
  emoji: string;
  name: string;
  category: ActivityCategory;
  duration: string;
  benefit: string;
  tag?: string;
  /** Photo (Unsplash CDN); emoji doubles as loading/failure fallback. */
  image: string;
}

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

export const PHASE_ACTIVITIES: Record<PhaseKey, Activity[]> = {
  menstrual: [
    { id: 'em1', emoji: '🧘', name: 'Restorative Yoga', category: 'exercise', duration: '15 min', tag: 'Gentle', benefit: 'Eases cramps and calms your nervous system.', image: img('1544367567-0f2fcb009e0b') },
    { id: 'em2', emoji: '🦵', name: 'Legs-Up-The-Wall', category: 'exercise', duration: '5 min', benefit: 'Reduces bloating and resets circulation.', image: img('1506126613408-eca07ce68773') },
    { id: 'em3', emoji: '🚶‍♀️', name: 'Slow Nature Walk', category: 'exercise', duration: '20 min', benefit: 'Light movement without draining your reserves.', image: img('1441974231531-c6227db76b6e') },
    { id: 'em4', emoji: '🌙', name: 'Body Scan Meditation', category: 'mindfulness', duration: '10 min', tag: 'Popular', benefit: 'Notice tension and let it go, one muscle at a time.', image: img('1518611012118-696072aa579a') },
    { id: 'em5', emoji: '📓', name: 'Journaling: Release', category: 'mindfulness', duration: '10 min', benefit: "Write down what you're ready to let go of this month.", image: img('1517842645767-c639042777db') },
    { id: 'em6', emoji: '🌬️', name: 'Deep Breathing (4-7-8)', category: 'mindfulness', duration: '5 min', benefit: 'Calms cramping and eases you toward rest.', image: img('1506905925346-21bda4d32df4') },
  ],
  follicular: [
    { id: 'ef1', emoji: '🚶', name: 'Brisk Walk or Light Jog', category: 'exercise', duration: '25 min', tag: 'Popular', benefit: 'Rising estrogen makes cardio feel easier — use it.', image: img('1476480862126-209bfaa8edc8') },
    { id: 'ef2', emoji: '💃', name: 'Dance Cardio', category: 'exercise', duration: '20 min', benefit: 'Channel your building energy into something fun.', image: img('1508700115892-45ecd05ae2ad') },
    { id: 'ef3', emoji: '🏋️‍♀️', name: 'Light Strength Training', category: 'exercise', duration: '30 min', benefit: 'Start building — your recovery capacity is climbing.', image: img('1517836357463-d25dfeac3438') },
    { id: 'ef4', emoji: '🚴', name: 'Cycling', category: 'exercise', duration: '30 min', tag: 'New', benefit: 'Explore a new route — novelty fuels this phase.', image: img('1517649763962-0c623066013b') },
    { id: 'ef5', emoji: '✨', name: 'Creative Visualization', category: 'mindfulness', duration: '10 min', benefit: "Picture the month ahead while your mind is primed for ideas.", image: img('1499728603263-13726abce5fd') },
    { id: 'ef6', emoji: '🌬️', name: 'Box Breathing for Focus', category: 'mindfulness', duration: '5 min', benefit: 'Sharpen concentration before deep work.', image: img('1506905925346-21bda4d32df4') },
  ],
  ovulation: [
    { id: 'eo1', emoji: '🔥', name: 'HIIT Workout', category: 'exercise', duration: '20 min', tag: 'Peak energy', benefit: 'Peak strength and power output — go hard today.', image: img('1571019613454-1cb2f99b2d8b') },
    { id: 'eo2', emoji: '🏃‍♀️', name: 'Running / Intervals', category: 'exercise', duration: '25 min', benefit: 'Your body can handle the intensity right now.', image: img('1461896836934-ffe607ba8211') },
    { id: 'eo3', emoji: '🤸‍♀️', name: 'Group Fitness Class', category: 'exercise', duration: '45 min', tag: 'Popular', benefit: 'Confidence and sociability peak — perfect for a class.', image: img('1518310383802-640c2de311b2') },
    { id: 'eo4', emoji: '🏋️', name: 'Strength Training', category: 'exercise', duration: '35 min', benefit: 'Heavier lifts land well this week.', image: img('1571008887538-b36bb32f4571') },
    { id: 'eo5', emoji: '💪', name: 'Confidence Visualization', category: 'mindfulness', duration: '8 min', benefit: "Rehearse the big conversation or pitch you've been planning.", image: img('1499728603263-13726abce5fd') },
    { id: 'eo6', emoji: '🙏', name: 'Gratitude Practice', category: 'mindfulness', duration: '5 min', benefit: 'Lock in this high before the shift into luteal.', image: img('1518611012118-696072aa579a') },
  ],
  luteal: [
    { id: 'el1', emoji: '🤸', name: 'Pilates', category: 'exercise', duration: '25 min', tag: 'Popular', benefit: 'Controlled, low-impact strength as energy tapers.', image: img('1518310383802-640c2de311b2') },
    { id: 'el2', emoji: '🧘‍♀️', name: 'Slow Flow Yoga', category: 'exercise', duration: '20 min', benefit: 'Eases tension building before your period.', image: img('1544367567-0f2fcb009e0b') },
    { id: 'el3', emoji: '🌲', name: 'Nature Walk', category: 'exercise', duration: '20 min', benefit: 'Lower-intensity movement that still clears your head.', image: img('1441974231531-c6227db76b6e') },
    { id: 'el4', emoji: '🎯', name: 'Foam Rolling & Mobility', category: 'exercise', duration: '10 min', benefit: 'Supports your body through rising sensitivity.', image: img('1506126613408-eca07ce68773') },
    { id: 'el5', emoji: '💆‍♀️', name: 'Progressive Muscle Relaxation', category: 'mindfulness', duration: '12 min', tag: 'New', benefit: 'Releases the tension that builds late in this phase.', image: img('1506905925346-21bda4d32df4') },
    { id: 'el6', emoji: '🌙', name: 'Guided Meditation for Calm', category: 'mindfulness', duration: '10 min', benefit: 'Counters rising cortisol sensitivity with stillness.', image: img('1518611012118-696072aa579a') },
  ],
};

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h || 1;
}

/** Deterministic shuffle so the same seed always yields the same order (no reshuffle on re-render). */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let s = hashSeed(seed);
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Four suggestions for the "keep this date anyway" popup.
 * - movable (a task she could have rescheduled): four exercise/mindfulness
 *   picks from that phase's catalog.
 * - not movable (a real synced calendar event): the phase's quick,
 *   do-it-anywhere breaks plus two desk-friendly mindfulness picks.
 */
export function pickSuggestions(phase: PhaseKey, movable: boolean, seed: string): Activity[] {
  if (movable) return seededShuffle(PHASE_ACTIVITIES[phase], seed).slice(0, 4);
  const mindful = seededShuffle(
    PHASE_ACTIVITIES[phase].filter((a) => a.category === 'mindfulness'),
    seed,
  ).slice(0, 2);
  return [...QUICK_BREAKS[phase], ...mindful];
}

/**
 * Low-effort, do-it-anywhere suggestions — no mat, no privacy, no change of
 * clothes needed. Used specifically for a real synced calendar event that
 * scores red: unlike a locally-created task, the app has no way to actually
 * move a real meeting, so an exercise recommendation often isn't practical
 * (she may well be sitting in an office). Kept separate from
 * PHASE_ACTIVITIES so the Insights tab's exercise/mindfulness grid is
 * unaffected.
 */
export const QUICK_BREAKS: Record<PhaseKey, Activity[]> = {
  menstrual: [
    { id: 'qm1', emoji: '☕', name: 'Warm Tea or Coffee Break', category: 'quick', duration: '5 min', benefit: 'A warm drink can ease cramping and gives you a genuine pause.', image: img('1615227875116-ae28a77814fb') },
    { id: 'qm2', emoji: '🍫', name: 'Small Treat', category: 'quick', duration: '5 min', benefit: "A little comfort food is fine — don't fight the craving.", image: img('1763700667398-24ae7f2289fc') },
  ],
  follicular: [
    { id: 'qf1', emoji: '☕', name: 'Coffee + New Idea', category: 'quick', duration: '5 min', benefit: 'Jot down one idea while your mind is sharp — no pressure to act on it yet.', image: img('1599008633840-052c7f756385') },
    { id: 'qf2', emoji: '🚶', name: 'Quick Walk to Refresh', category: 'quick', duration: '5 min', benefit: 'A short walk channels rising energy without needing a full workout.', image: img('1531398745307-6ad63a8b5284') },
  ],
  ovulation: [
    { id: 'qo1', emoji: '☕', name: 'Chat Over Coffee', category: 'quick', duration: '5 min', benefit: 'Confidence peaks now — a quick chat with a colleague fits the mood.', image: img('1582298538104-fe2e74c27f59') },
    { id: 'qo2', emoji: '🌤️', name: 'Step Outside for Air', category: 'quick', duration: '5 min', benefit: 'A few minutes outside keeps your energy from tipping into restlessness.', image: img('1622491260242-173f7c473dfe') },
  ],
  luteal: [
    { id: 'ql1', emoji: '☕', name: 'Comfort Drink Break', category: 'quick', duration: '5 min', benefit: 'A warm drink and a pause help offset rising irritability.', image: img('1542990253-0d0f5be5f0ed') },
    { id: 'ql2', emoji: '🍪', name: 'Snack Break', category: 'quick', duration: '5 min', benefit: 'Blood sugar dips are common now — a small snack helps steady your mood.', image: img('1543158181-1274e5362710') },
  ],
};

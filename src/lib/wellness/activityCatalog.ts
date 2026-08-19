import type { PhaseKey } from '@/types/models';

export type ActivityCategory = 'exercise' | 'mindfulness';

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

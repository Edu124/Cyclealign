export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';

export type PhaseKey = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  gender: Gender;
  birthDate: string; // ISO date (yyyy-mm-dd)
  avgCycleLength: number; // days
  avgPeriodLength: number; // days
  /** Life-context role — changes display copy only, never logic. */
  role?: string;
  createdAt?: string;
}

export interface CycleLog {
  id: string;
  userId: string;
  startDate: string; // ISO date (yyyy-mm-dd) — first day of period
  endDate?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface DateRange {
  start: string; // ISO date
  end: string; // ISO date
}

export interface Prediction {
  dayOfCycle: number; // 1-based day within the current cycle
  cycleLength: number; // effective cycle length used for the math
  currentPhase: PhaseKey;
  nextPeriodStart: string; // ISO date
  daysUntilNextPeriod: number;
  ovulationDate: string; // ISO date
  fertileWindow: DateRange;
  periodWindow: DateRange; // current/most-recent period span
  /** True when today has passed the expected next period start and no new period has been logged. */
  isOverdue: boolean;
}

export interface PhaseInfo {
  key: PhaseKey;
  title: string;
  subtitle: string;
  /** Inclusive day-of-cycle range [from, to] for the user's effective cycle. */
  range: [number, number];
}

// ── Community ──────────────────────────────────────────────────────────────

export interface WeeklyTopic {
  id: string;
  title: string;
  body: string | null;
  isActive: boolean;
  weekStart: string | null;
  createdAt: string;
}

export type ReactionType = 'felt_this' | 'sending_energy' | 'inspiring';

export interface ReactionCounts {
  felt_this: number;
  sending_energy: number;
  inspiring: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  topicId: string | null;
  content: string;
  isAnonymous: boolean;
  phaseKey: PhaseKey | null;
  cycleDay: number | null;
  displayName: string;
  createdAt: string;
  reactions: ReactionCounts;
  myReaction: ReactionType | null;
}

export interface DopamineItem {
  id: string;
  phaseKey: PhaseKey | 'all';
  label: string;
  emoji: string;
  durationMinutes: number;
  sortOrder: number;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  emoji: string;
  accentColor: string;
  author: string;
  publishedAt: string;
}

export interface DailyLog {
  dateISO: string;
  energy: number; // 1..5
  mood: string;
  win: string; // max 60 chars
}

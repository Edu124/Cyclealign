export type UserRole =
  | 'corporate'
  | 'entrepreneur'
  | 'homemaker'
  | 'student'
  | 'other';

export interface RoleOption {
  value: UserRole;
  label: string;
  /** Short context line shown under the option. */
  hint: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { value: 'corporate', label: 'Corporate professional', hint: 'Leading in the workplace' },
  { value: 'entrepreneur', label: 'Entrepreneur / Founder', hint: 'Building something of your own' },
  { value: 'homemaker', label: 'Homemaker / Family manager', hint: 'Leading at home' },
  { value: 'student', label: 'Student', hint: 'Leading your own growth' },
  { value: 'other', label: 'Other / Prefer not to say', hint: 'However you lead' },
];

/**
 * Role changes DISPLAY COPY ONLY — never features or phase logic. This maps a
 * role to a short, affirming descriptor used in personalised copy (e.g. the
 * Home greeting subtitle).
 */
export const ROLE_COPY: Record<UserRole, string> = {
  corporate: 'Here\'s your edge for the week ahead, leader.',
  entrepreneur: 'Your body is your first venture — here\'s today.',
  homemaker: 'You hold it all together. Here\'s you, first.',
  student: 'Study your rhythm — here\'s your overview.',
  other: 'Here\'s your health overview.',
};

export function roleSubtitle(role?: string | null): string {
  if (role && role in ROLE_COPY) return ROLE_COPY[role as UserRole];
  return ROLE_COPY.other;
}

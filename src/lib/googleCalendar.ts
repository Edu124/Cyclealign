/**
 * Google Calendar integration — OAuth authorization + event fetching.
 *
 * Setup (one-time, done in Google Cloud Console):
 * 1. Create a project → enable "Google Calendar API"
 * 2. OAuth consent screen → add scope: calendar.readonly
 * 3. Create credentials → OAuth 2.0 Client IDs:
 *    - Web: authorized redirect URI = http://localhost:8081 (dev) + https://auth.expo.io/@<username>/<slug>
 *    - Android: package name = your app bundle ID
 *    - iOS: bundle ID = your app bundle ID
 * 4. Add to .env.local:
 *      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
 *      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
 *      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxx.apps.googleusercontent.com
 */

import type { CalendarEvent } from '@/lib/stores/useCalendar';

// ── Category inference ────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  HIGH_CONVO: [
    'pitch', 'presentation', 'negotiation', 'interview', 'board meeting',
    'investor', 'salary', 'performance review', 'client meeting',
    'stakeholder', 'demo day', 'all-hands', 'town hall',
  ],
  DECISION: [
    'strategy', 'planning session', 'decision', 'quarterly review',
    'sprint planning', 'roadmap', 'retrospective', 'retro', 'post-mortem',
  ],
  DEEP_FOCUS: [
    'deep work', 'focus block', 'writing', 'design review', 'coding',
    'research', 'brainstorm', 'workshop', 'creative',
  ],
  MEETING: [
    'standup', 'stand-up', 'sync', '1:1', 'one-on-one', 'team meeting',
    'call', 'catchup', 'catch-up', 'kick-off', 'kickoff', 'weekly',
  ],
  ADMIN: [
    'admin', 'email', 'invoice', 'paperwork', 'expense', 'filing', 'hr',
    'onboarding', 'offboarding',
  ],
  PERSONAL: [
    'doctor', 'dentist', 'appointment', 'personal', 'private', 'family',
    'birthday', 'anniversary', 'vacation', 'holiday',
  ],
};

export function inferCategory(summary: string): string {
  const s = summary.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => s.includes(kw))) return cat;
  }
  return 'MEETING'; // most calendar events are meetings by default
}

// ── Google Calendar REST API ──────────────────────────────────────────────────

interface GoogleEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  visibility?: 'public' | 'private' | 'confidential' | 'default';
}

function mapGoogleEvent(e: GoogleEvent): CalendarEvent {
  const summary = e.summary ?? 'Event';
  const raw = e.start?.dateTime ?? e.start?.date ?? '';
  const dateISO = raw.split('T')[0];
  const timeLabel = e.start?.dateTime
    ? new Date(e.start.dateTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'All day';

  return {
    id: `g-${e.id}`,
    title: summary,
    categoryId: inferCategory(summary),
    dateISO,
    timeLabel,
    isPrivate: e.visibility === 'private' || e.visibility === 'confidential',
  };
}

/**
 * Fetch the next 30 days of events from the user's primary Google Calendar.
 * Throws if the request fails (token expired, network error, etc.).
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
): Promise<CalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const timeMax = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const url = new URL(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  );
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: { message?: string } })?.error?.message ??
        `Google Calendar API error (HTTP ${res.status})`,
    );
  }

  const data = (await res.json()) as { items?: GoogleEvent[] };
  return (data.items ?? []).map(mapGoogleEvent);
}

/** Returns true if Google Calendar client IDs are present in env. */
export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  );
}

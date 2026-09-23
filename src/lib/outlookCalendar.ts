/**
 * Outlook / Microsoft 365 Calendar integration — OAuth token refresh +
 * Microsoft Graph event fetching. The sign-in request itself lives in
 * plan.tsx (no prebuilt Microsoft provider exists in expo-auth-session the
 * way there is for Google, so it's built on the generic AuthSession APIs).
 *
 * Setup (one-time, done in Microsoft Entra ID / Azure):
 * 1. Entra ID → App registrations → New registration
 *    - Supported account types: "Any Entra ID Tenant + Personal Microsoft accounts"
 *    - Platform: Mobile and desktop applications
 *    - Redirect URI: com.cyclealign.app://oauthredirect
 * 2. API permissions → Add → Microsoft Graph → Delegated → Calendars.ReadWrite
 *    (write is needed to move an event to a better date)
 * 3. Authentication → Allow public client flows → Yes
 * 4. Add to .env:
 *      EXPO_PUBLIC_OUTLOOK_CLIENT_ID=xxxx-xxxx-xxxx-xxxx
 */

import { Platform } from 'react-native';
import type { CalendarEvent } from '@/lib/stores/useCalendar';
import { inferCategory } from '@/lib/googleCalendar';

interface OutlookEvent {
  id: string;
  subject?: string;
  start?: { dateTime?: string; timeZone?: string };
  sensitivity?: 'normal' | 'personal' | 'private' | 'confidential';
  isCancelled?: boolean;
}

function mapOutlookEvent(e: OutlookEvent): CalendarEvent {
  const summary = e.subject ?? 'Event';
  const raw = e.start?.dateTime ?? '';
  const dateISO = raw.split('T')[0];
  // With Prefer: outlook.timezone="UTC", Graph returns dateTime WITHOUT a
  // trailing Z (just a local-format string in that timezone) — append it so
  // this parses as a valid instant instead of Hermes returning Invalid Date.
  const timeLabel = raw
    ? new Date(raw.endsWith('Z') ? raw : `${raw}Z`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'All day';

  return {
    id: `o-${e.id}`,
    title: summary,
    categoryId: inferCategory(summary),
    dateISO,
    timeLabel,
    isPrivate: e.sensitivity === 'private' || e.sensitivity === 'confidential',
  };
}

/**
 * Fetch the next 30 days of events from the user's primary Outlook calendar.
 * Throws if the request fails (token expired, network error, etc.).
 */
export async function fetchOutlookCalendarEvents(
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

  const params = [
    `startDateTime=${encodeURIComponent(timeMin)}`,
    `endDateTime=${encodeURIComponent(timeMax)}`,
    `${encodeURIComponent('$orderby')}=${encodeURIComponent('start/dateTime')}`,
    `${encodeURIComponent('$top')}=50`,
  ].join('&');
  const url = `https://graph.microsoft.com/v1.0/me/calendarview?${params}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: { message?: string } })?.error?.message ??
        `Outlook Calendar API error (HTTP ${res.status})`,
    );
  }

  const data = (await res.json()) as { value?: OutlookEvent[] };
  return (data.value ?? [])
    .filter((e) => !e.isCancelled)
    .map(mapOutlookEvent);
}

const OUTLOOK_TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
// Tried in order on refresh: a refresh token can only be exchanged for scopes
// it was originally granted, so people who connected before write access
// existed fall back to read-only instead of losing their sync.
const OUTLOOK_SCOPE_SETS = [
  'openid profile offline_access https://graph.microsoft.com/Calendars.ReadWrite',
  'openid profile offline_access https://graph.microsoft.com/Calendars.Read',
];

/**
 * Mint a fresh access token from a stored refresh token. Microsoft rotates
 * the refresh token on every use — the caller MUST store the new one, or the
 * next refresh will fail with an already-used token. Returns null (never
 * throws) so callers fall back to the stale token rather than crash.
 */
export async function refreshOutlookAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const clientId = process.env.EXPO_PUBLIC_OUTLOOK_CLIENT_ID;
  if (!clientId) return null;

  for (const scope of OUTLOOK_SCOPE_SETS) {
    try {
      const body = [
        `client_id=${encodeURIComponent(clientId)}`,
        `refresh_token=${encodeURIComponent(refreshToken)}`,
        'grant_type=refresh_token',
        `scope=${encodeURIComponent(scope)}`,
      ].join('&');
      const res = await fetch(OUTLOOK_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { access_token?: string; refresh_token?: string };
      if (!data.access_token) continue;
      return { accessToken: data.access_token, refreshToken: data.refresh_token ?? refreshToken };
    } catch {
      // try the next scope set
    }
  }
  return null;
}

/**
 * Native only — a custom-scheme redirect (com.cyclealign.app://oauthredirect)
 * has nothing to catch it in a plain web browser tab, so this is gated off
 * on web the same way isGoogleCalendarConfigured() gates per-platform gaps.
 */
export function isOutlookCalendarConfigured(): boolean {
  if (Platform.OS === 'web') return false;
  return !!process.env.EXPO_PUBLIC_OUTLOOK_CLIENT_ID;
}

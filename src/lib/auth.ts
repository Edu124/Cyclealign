import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Display name the provider handed back (Google/Apple), when available. */
  name?: string;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured (running in demo mode).' };
  }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: Linking.createURL('/'),
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured (running in demo mode).' };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Start an OAuth flow (Google / Apple) via an in-app browser session. */
export async function signInWithProvider(
  provider: 'google' | 'apple',
): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured (running in demo mode).' };
  }
  try {
    return await startOAuthFlow(provider);
  } catch (err: unknown) {
    // Callers alert on !ok; a throw here used to vanish as an unhandled
    // rejection, making failures look like "nothing happened".
    const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
    return { ok: false, error: msg };
  }
}

async function startOAuthFlow(provider: 'google' | 'apple'): Promise<AuthResult> {
  const redirectTo = makeRedirectUri({ scheme: 'cyclealign' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.url) return { ok: false, error: 'Could not start sign-in.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    return { ok: false, error: 'Sign-in was cancelled.' };
  }

  // Parse the return URL with expo-linking: Hermes does not implement
  // URL.searchParams, so `new URL(url).searchParams` throws on-device —
  // which silently killed the flow right after the browser closed.
  const { queryParams } = Linking.parse(result.url);
  const code =
    typeof queryParams?.code === 'string' ? queryParams.code : null;
  const oauthError =
    typeof queryParams?.error_description === 'string'
      ? queryParams.error_description
      : null;

  if (oauthError) return { ok: false, error: oauthError };
  if (!code) {
    return { ok: false, error: 'Sign-in did not complete. Please try again.' };
  }

  const { data: sessionData, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exErr) return { ok: false, error: exErr.message };
  return { ok: true, name: nameFromMetadata(sessionData.user?.user_metadata) };
}

/** Google/Apple populate this differently — check every field either provider uses. */
export function nameFromMetadata(meta: Record<string, unknown> | undefined): string | undefined {
  const name = meta?.full_name || meta?.name || meta?.given_name;
  return typeof name === 'string' && name.trim() ? name.trim() : undefined;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of base64) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/**
 * Decode a JWT's payload claims without verifying the signature — safe here
 * because Supabase independently verifies the same token server-side; this
 * is only used to read display fields (name, picture) directly off the
 * token, rather than trusting how/when Supabase mirrors them into
 * user_metadata (which turned out to lag or omit them for Google).
 */
export function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const bytes = base64UrlDecode(payload);
    // Re-encode as %XX escapes so decodeURIComponent can restore UTF-8
    // (names routinely contain non-ASCII characters).
    const utf8 = decodeURIComponent(
      Array.from(bytes)
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(utf8);
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

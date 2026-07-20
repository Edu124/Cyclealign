import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AuthResult {
  ok: boolean;
  error?: string;
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

  const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exErr) return { ok: false, error: exErr.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

import * as Google from 'expo-auth-session/providers/google';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AuthResult } from '@/lib/auth';

// useIdTokenAuthRequest throws at mount when the current platform's client ID
// is undefined; the placeholder keeps screens alive (callers gate on real config).
const PLACEHOLDER_ID = 'unconfigured.apps.googleusercontent.com';

/**
 * Direct-to-Google sign-in (no Supabase browser redirect): Google returns an
 * ID token straight to the app, and supabase.auth.signInWithIdToken exchanges
 * it for the same Supabase session the old flow produced. Users, rows and RLS
 * are untouched — only the handshake changes. Bonus: Google's consent screen
 * shows the app's own branding instead of the supabase.co domain.
 *
 * Requires the client IDs to be listed under Supabase → Auth → Google →
 * "Authorized Client IDs", or the token's audience is rejected.
 */
export function useGoogleSignIn() {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? PLACEHOLDER_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? PLACEHOLDER_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? PLACEHOLDER_ID,
  });

  async function signIn(): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured (running in demo mode).' };
    }
    try {
      const res = await promptAsync();
      if (res?.type !== 'success') {
        return { ok: false, error: 'Sign-in was cancelled.' };
      }
      const idToken = (res.params as Record<string, string>)?.id_token;
      if (!idToken) {
        return { ok: false, error: 'Google did not return a token. Please try again.' };
      }
      // No nonce forwarded: expo-auth-session's nonce reaches the token in a
      // shape GoTrue can't verify ("Nonces mismatch"), so the Supabase Google
      // provider must have "Skip nonce checks" enabled.
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      return { ok: false, error: msg };
    }
  }

  return { signIn };
}

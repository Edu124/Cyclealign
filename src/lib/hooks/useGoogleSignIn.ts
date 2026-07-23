import { Platform } from 'react-native';
import { exchangeCodeAsync } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AuthResult } from '@/lib/auth';

// The auth hooks throw at mount when the current platform's client ID is
// undefined; the placeholder keeps screens alive (real config gates the flow).
const PLACEHOLDER_ID = 'unconfigured.apps.googleusercontent.com';

const WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? PLACEHOLDER_ID;
const ANDROID_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? PLACEHOLDER_ID;
const IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? PLACEHOLDER_ID;

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/**
 * Direct-to-Google sign-in exchanged with supabase.auth.signInWithIdToken —
 * same session and user rows as the browser flow, no supabase.co detour.
 *
 * Flow per platform, dictated by Google:
 *  - iOS/Android (installed-app clients): authorization-code + PKCE, then the
 *    token endpoint returns the id_token. Google rejects the implicit
 *    id_token response for these client types ("unsupported_response_type").
 *  - Web: implicit id_token — allowed for web clients, and avoids needing the
 *    client secret that a web-client code exchange would demand.
 *
 * Requires all client IDs in Supabase → Auth → Google → Client IDs.
 */
export function useGoogleSignIn() {
  const config = {
    clientId: WEB_ID,
    androidClientId: ANDROID_ID,
    iosClientId: IOS_ID,
    scopes: ['openid', 'profile', 'email'],
  };

  // Both hooks mount unconditionally (rules of hooks); platform picks at call.
  const [codeRequest, , promptCode] = Google.useAuthRequest(config);
  const [, , promptIdToken] = Google.useIdTokenAuthRequest(config);

  async function signIn(): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured (running in demo mode).' };
    }
    try {
      if (Platform.OS === 'web') {
        const res = await promptIdToken();
        if (res?.type !== 'success') return { ok: false, error: 'Sign-in was cancelled.' };
        const idToken = (res.params as Record<string, string>)?.id_token;
        if (!idToken) return { ok: false, error: 'Google did not return a token. Please try again.' };
        return exchangeWithSupabase(idToken);
      }

      // Native: code + PKCE.
      const res = await promptCode();
      if (res?.type !== 'success') return { ok: false, error: 'Sign-in was cancelled.' };

      // The Google provider may auto-exchange the code; fall back to a manual
      // exchange when it hasn't (no client secret needed for app clients).
      let idToken = res.authentication?.idToken ?? null;
      const code = (res.params as Record<string, string>)?.code;
      if (!idToken && code && codeRequest) {
        const tokens = await exchangeCodeAsync(
          {
            clientId: Platform.OS === 'ios' ? IOS_ID : ANDROID_ID,
            code,
            redirectUri: codeRequest.redirectUri,
            extraParams: codeRequest.codeVerifier
              ? { code_verifier: codeRequest.codeVerifier }
              : {},
          },
          { tokenEndpoint: GOOGLE_TOKEN_ENDPOINT },
        );
        idToken = tokens.idToken ?? null;
      }
      if (!idToken) return { ok: false, error: 'Google did not return a token. Please try again.' };
      return exchangeWithSupabase(idToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      return { ok: false, error: msg };
    }
  }

  return { signIn };
}

async function exchangeWithSupabase(idToken: string): Promise<AuthResult> {
  // Nonce is not forwarded: the libraries' nonce shapes don't survive the
  // round-trip verifiably, so the Supabase Google provider runs with
  // "Skip nonce checks" enabled.
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

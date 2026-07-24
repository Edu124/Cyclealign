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
 * Direct-to-Google sign-in exchanged with supabase.auth.signInWithIdToken.
 *
 * Native (iOS/Android): authorization-code + PKCE — Google's required flow
 * for installed apps. shouldAutoExchangeCode is disabled so OUR exchange is
 * the only consumer of the one-time code (the library's auto-exchange racing
 * ours meant one of the two always failed with invalid_grant).
 * Web: implicit id_token (allowed for web clients; needs no client secret).
 *
 * Errors carry [G*] tags so field reports identify the failing step.
 */
export function useGoogleSignIn() {
  const [codeRequest, , promptCode] = Google.useAuthRequest({
    clientId: WEB_ID,
    androidClientId: ANDROID_ID,
    iosClientId: IOS_ID,
    scopes: ['openid', 'profile', 'email'],
    shouldAutoExchangeCode: false,
  });
  const [, , promptIdToken] = Google.useIdTokenAuthRequest({
    clientId: WEB_ID,
    androidClientId: ANDROID_ID,
    iosClientId: IOS_ID,
  });

  async function signIn(): Promise<AuthResult> {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured (running in demo mode).' };
    }
    try {
      if (Platform.OS === 'web') {
        const res = await promptIdToken();
        if (res?.type !== 'success') return { ok: false, error: 'Sign-in was cancelled.' };
        const idToken = (res.params as Record<string, string>)?.id_token;
        if (!idToken) return { ok: false, error: 'Google did not return a token. [G0]' };
        return exchangeWithSupabase(idToken);
      }

      const res = await promptCode();
      if (res?.type !== 'success') return { ok: false, error: 'Sign-in was cancelled.' };

      const code = (res.params as Record<string, string>)?.code;
      if (!code) {
        return { ok: false, error: 'Google did not return a sign-in code. [G1]' };
      }

      let idToken: string | null = null;
      try {
        const tokens = await exchangeCodeAsync(
          {
            clientId: Platform.OS === 'ios' ? IOS_ID : ANDROID_ID,
            code,
            redirectUri: codeRequest?.redirectUri ?? '',
            extraParams: codeRequest?.codeVerifier
              ? { code_verifier: codeRequest.codeVerifier }
              : {},
          },
          { tokenEndpoint: GOOGLE_TOKEN_ENDPOINT },
        );
        idToken = tokens.idToken ?? null;
      } catch (exchangeErr: unknown) {
        const msg = exchangeErr instanceof Error ? exchangeErr.message : String(exchangeErr);
        return { ok: false, error: `Could not complete sign-in (${msg}). [G2]` };
      }

      if (!idToken) {
        return { ok: false, error: 'Google did not return a token. [G3]' };
      }
      return exchangeWithSupabase(idToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      return { ok: false, error: `${msg} [G4]` };
    }
  }

  return { signIn };
}

async function exchangeWithSupabase(idToken: string): Promise<AuthResult> {
  // Nonce is not forwarded — the Supabase Google provider runs with
  // "Skip nonce checks" enabled.
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) return { ok: false, error: `${error.message} [G5]` };
  return { ok: true };
}

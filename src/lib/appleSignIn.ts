import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { signInWithProvider, type AuthResult } from '@/lib/auth';

/**
 * Native Sign in with Apple: the system Face ID sheet on iOS, exchanged with
 * supabase.auth.signInWithIdToken — same session and user rows as the browser
 * flow, no browser round-trip. Non-iOS platforms (and older iOS without the
 * capability) fall back to the Supabase browser flow.
 *
 * Requires "com.cyclealign.app" in Supabase → Auth → Apple → Client IDs.
 * Ships with the 1.1.0 binary — the native module does not exist in 1.0.0.
 */
export async function signInWithApple(): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase is not configured (running in demo mode).' };
  }
  if (Platform.OS !== 'ios') {
    return signInWithProvider('apple');
  }

  try {
    const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
    if (!available) return signInWithProvider('apple');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { ok: false, error: 'Apple did not return a token. Please try again.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e?.code === 'ERR_REQUEST_CANCELED') {
      return { ok: false, error: 'Sign-in was cancelled.' };
    }
    return { ok: false, error: e?.message ?? 'Apple sign-in failed. Please try again.' };
  }
}

import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { palette } from '@/theme';

/**
 * Landing pad for OAuth redirects (com.cyclealign.app:/oauthredirect).
 * expo-auth-session resolves the pending sign-in from the URL event; this
 * route only exists so the router doesn't flash "Unmatched Route" while that
 * happens. It immediately steps back to the app.
 */
export default function OAuthRedirect() {
  useEffect(() => {
    const t = setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    }, 50);
    return () => clearTimeout(t);
  }, []);
  return <View style={{ flex: 1, backgroundColor: palette.bg }} />;
}

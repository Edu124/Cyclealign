import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { useReferralPrompt } from '@/lib/stores/useReferralPrompt';
import { cancelReferralNudge, scheduleReferralNudge } from '@/lib/notifications';

// Minimum time between nudges so backgrounding the app repeatedly in one
// sitting (switching apps, checking messages) doesn't spam notifications.
const MIN_GAP_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Renders nothing — this is a lifecycle-only effect. iOS gives no way to
 * show UI at the instant of closing, so the Android exit-flow trick
 * (ExitFlowOverlay, hardware back button) can't fire there. Instead, the
 * instant the app backgrounds, we schedule a local notification a few
 * seconds out ("Miss you already"). If the user comes straight back before
 * it fires, it's cancelled so a quick app-switch doesn't trigger a nudge.
 */
export function ReferralCloseNudge() {
  const pendingId = useRef<string | null>(null);
  const lastShownAt = useReferralPrompt((s) => s.lastShownAt);
  const markShown = useReferralPrompt((s) => s.markShown);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        const dueForNudge =
          !lastShownAt || Date.now() - new Date(lastShownAt).getTime() > MIN_GAP_MS;
        if (dueForNudge && !pendingId.current) {
          markShown();
          scheduleReferralNudge().then((id) => {
            pendingId.current = id;
          });
        }
        return;
      }
      if (next === 'active' && pendingId.current) {
        cancelReferralNudge(pendingId.current);
        pendingId.current = null;
      }
    });

    return () => sub.remove();
  }, [lastShownAt]);

  return null;
}

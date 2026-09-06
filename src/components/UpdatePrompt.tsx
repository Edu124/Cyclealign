import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { Button } from '@/components/ui';
import { palette, radius, shadow, spacing } from '@/theme';

/**
 * Checks once per launch for a new OTA update, in the background — never
 * blocks the splash screen or the UI. If one is found and downloaded, shows
 * a prompt so the user decides when to apply it, instead of the app
 * silently swapping itself out from under them.
 */
export function UpdatePrompt() {
  const [ready, setReady] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !Updates.isEnabled) return;
    let cancelled = false;

    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable || cancelled) return;
        await Updates.fetchUpdateAsync();
        if (!cancelled) setReady(true);
      } catch {
        // No network, dev client, or a transient error — stay quiet.
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function applyUpdate() {
    setApplying(true);
    try {
      await Updates.reloadAsync();
    } catch {
      setApplying(false);
    }
  }

  if (!ready) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>✨</Text>
          </View>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.subtitle}>
            A new version of CycleAlign is ready — update now to get the latest improvements.
          </Text>
          <Button
            label={applying ? 'Updating…' : 'Update Now'}
            onPress={applyUpdate}
            loading={applying}
            style={styles.btn}
          />
          {!applying && (
            <Pressable onPress={() => setReady(false)} hitSlop={12}>
              <Text style={styles.later}>Later</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47,42,37,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadow.soft,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: palette.lavender + '33',
  },
  emoji: { fontSize: 30 },
  title: { fontSize: 20, fontWeight: '800', color: palette.ink, textAlign: 'center' },
  subtitle: {
    fontSize: 14,
    color: palette.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  btn: { width: '100%' },
  later: { fontSize: 13, fontWeight: '600', color: palette.muted, marginTop: spacing.xs },
});

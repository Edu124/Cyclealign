import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from '@/components/ui';
import { ExitFlowOverlay } from '@/components/exit/ExitFlowOverlay';
import { palette, spacing } from '@/theme';

/**
 * Dev-only preview route: lets you view/click through the two exit-flow
 * cards on web without needing the Android hardware back button.
 * Not linked from anywhere in the app UI.
 */
export default function ExitPreview() {
  const [stage, setStage] = useState<'referral' | 'confirm' | null>('referral');

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.heading}>Exit flow preview</Text>
      <Text style={styles.hint}>Dev-only route — not reachable from normal app navigation.</Text>

      <Button label="Show referral card (1st back press)" onPress={() => setStage('referral')} />
      <Button
        label="Show confirm-exit card (2nd back press)"
        variant="secondary"
        onPress={() => setStage('confirm')}
      />
      <Button label="Back to app" variant="secondary" onPress={() => router.back()} />

      {stage && <ExitFlowOverlay key={stage} debugStage={stage} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  heading: { fontSize: 20, fontWeight: '800', color: palette.ink },
  hint: { fontSize: 13, color: palette.muted, marginBottom: spacing.md },
});

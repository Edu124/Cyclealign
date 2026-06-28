import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, spacing } from '@/theme';
import { FEATURE_ORBS, FeatureOrb } from './features';
import { InfoOrb } from './InfoOrb';
import { OrbRevealModal } from './OrbRevealModal';

/**
 * "Tap to explore" — a row of floating 3D orbs. Tapping one opens a reveal card
 * explaining that feature. A tactile, delightful way to discover the app.
 */
export function ExploreSection() {
  const [selected, setSelected] = useState<FeatureOrb | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Tap to explore ✨</Text>
        <Text style={styles.subtitle}>
          Give an orb a tap to see what it does
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FEATURE_ORBS.map((orb, i) => (
          <InfoOrb key={orb.key} orb={orb} index={i} onPress={setSelected} />
        ))}
      </ScrollView>

      <OrbRevealModal orb={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  header: { gap: 2 },
  title: { fontSize: 20, fontWeight: '700', color: palette.ink },
  subtitle: { fontSize: 14, color: palette.inkSoft },
  row: {
    gap: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
});

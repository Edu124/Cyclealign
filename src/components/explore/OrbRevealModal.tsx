import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { palette, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/theme/fonts';
import { FeatureOrb } from './features';
import { OrbVisual } from './OrbVisual';

interface Props {
  orb: FeatureOrb | null;
  onClose: () => void;
}

/** Full-screen reveal: the tapped orb floats above an info card that zooms in. */
export function OrbRevealModal({ orb, onClose }: Props) {
  return (
    <Modal
      visible={!!orb}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {orb && (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            style={styles.cardWrap}
          >
            <View style={styles.orbFloat} pointerEvents="none">
              <OrbVisual size={132} colors={orb.colors} emoji={orb.emoji} />
            </View>

            <View style={styles.card}>
              <Text style={[styles.title, { color: orb.colors.dark }]}>
                {orb.title}
              </Text>
              <Text style={styles.body}>{orb.body}</Text>

              <View style={styles.points}>
                {orb.points.map((p) => (
                  <View key={p} style={styles.pointRow}>
                    <View
                      style={[styles.dot, { backgroundColor: orb.colors.base }]}
                    />
                    <Text style={styles.pointText}>{p}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[styles.cta, { backgroundColor: orb.colors.dark }]}
                onPress={onClose}
              >
                <Text style={styles.ctaText}>Got it</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(58,46,85,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  cardWrap: { width: '100%', maxWidth: 380, alignItems: 'center' },
  orbFloat: { marginBottom: -56, zIndex: 2 },
  card: {
    width: '100%',
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    paddingTop: 72,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    ...shadow.glow,
  },
  title: {
    fontFamily: fonts.name,
    fontSize: 30,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  points: { alignSelf: 'stretch', gap: spacing.md, marginBottom: spacing.xl },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pointText: { flex: 1, fontSize: 15, color: palette.ink },
  cta: {
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ctaText: { color: palette.white, fontSize: 16, fontWeight: '700' },
});

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import type { TaskGuidance } from '@/lib/wellness/taskGuidance';

interface Props {
  visible: boolean;
  /** 'ideal' = §2 step 4A (great timing — why it works + how to use it).
   *  'blocked' = §2 step 4B (can't move it — how to make it work). */
  variant?: 'ideal' | 'blocked';
  categoryLabel: string;
  phaseName: string;
  /** Label for the phase row — "Current phase" for cycle-based users, "Your readiness" otherwise. */
  phaseRowLabel?: string;
  approach: string;
  guidance: TaskGuidance;
  color: string;
  ctaLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const COPY = {
  ideal: {
    header: 'Great timing — make the most of it.',
    subtitle:
      "Your task lines up with your ideal window for this. Here's why it works, and how to prepare, perform and recover at your best.",
  },
  blocked: {
    header: "Can't move it? Let's make it work.",
    subtitle:
      "Your task falls outside your preferred timing window. Here's how to make it more manageable today.",
  },
};

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <View style={styles.bullets}>
        {items.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: color }]} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * The phase-aware action plan (Developer Spec §5): PREPARE / PERFORM / RECOVER
 * for the chosen task category and phase. Used for both §2 step 4A (ideal
 * window — why it works) and step 4B (can't move it — how to make it work).
 */
export function TaskGuidanceCard({
  visible,
  variant = 'blocked',
  categoryLabel,
  phaseName,
  phaseRowLabel = 'Current phase',
  approach,
  guidance,
  color,
  ctaLabel = "I'm ready",
  onConfirm,
  onClose,
}: Props) {
  const copy = COPY[variant];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.popup} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.header}>{copy.header}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Task</Text>
                <Text style={styles.metaValue}>{categoryLabel}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{phaseRowLabel}</Text>
                <Text style={styles.metaValue}>{phaseName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>CycleAlign approach</Text>
                <Text style={[styles.metaValue, { color }]}>{approach}</Text>
              </View>
            </View>

            <Section title="PREPARE" items={guidance.prepare} color={color} />
            <Section title="PERFORM" items={guidance.perform} color={color} />
            <Section title="RECOVER" items={guidance.recover} color={color} />

            <Pressable style={[styles.cta, { backgroundColor: color }]} onPress={onConfirm}>
              <Text style={styles.ctaText}>{ctaLabel}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47,42,37,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  popup: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    backgroundColor: dash.card,
    borderRadius: 22,
  },
  content: { padding: 20, gap: 14 },
  header: { fontFamily: fonts.headingBold, fontSize: 18, color: dash.ink, letterSpacing: -0.2 },
  subtitle: { fontSize: 13, color: dash.inkSoft, lineHeight: 19 },
  metaBox: {
    backgroundColor: '#F9F6F1',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 12, color: dash.muted, fontWeight: '600' },
  metaValue: { fontSize: 13, color: dash.ink, fontWeight: '700' },
  section: { gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  bullets: { gap: 5 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: dash.ink },
  cta: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});

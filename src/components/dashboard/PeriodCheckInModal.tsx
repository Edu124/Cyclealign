import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { dash } from '@/theme';

interface Props {
  visible: boolean;
  onYes: () => void;
  onNotYet: () => void;
}

export function PeriodCheckInModal({ visible, onYes, onNotYet }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onNotYet}>
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(280)} style={styles.card}>
          <Text style={styles.emoji}>🌙</Text>
          <Text style={styles.title}>Did your period start?</Text>
          <Text style={styles.body}>
            Based on your cycle, you might have gotten your period. Let us know so we can keep your phase tracking accurate.
          </Text>
          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.notYetBtn, pressed && { opacity: 0.8 }]} onPress={onNotYet}>
              <Text style={styles.notYetLabel}>Not yet</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.yesBtn, pressed && { opacity: 0.85 }]} onPress={onYes}>
              <Text style={styles.yesLabel}>Yes</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FAF8F4',
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#2E2A26',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  emoji: { fontSize: 30, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '800', color: dash.ink, textAlign: 'center' },
  body: {
    fontSize: 13.5,
    color: dash.inkSoft,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 18,
  },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  notYetBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1ECE3',
  },
  notYetLabel: { fontSize: 14, fontWeight: '700', color: dash.inkSoft },
  yesBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#B06070',
  },
  yesLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

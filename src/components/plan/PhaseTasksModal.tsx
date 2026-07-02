import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { dash, phaseColors, palette, spacing } from '@/theme';
import { getTasksForPhaseAndRole } from '@/lib/intelligence/roleTasks';
import { ROLE_OPTIONS } from '@/lib/roles';
import type { PhaseKey } from '@/types/models';
import type { RecommendedWindow } from '@/lib/intelligence/schedule';

interface Props {
  window: RecommendedWindow | null;
  role?: string | null;
  onClose: () => void;
}

// Canonical phase names (client spec) — always the primary label.
const PHASE_LABELS: Record<PhaseKey, string> = {
  menstrual:  'Menstrual phase',
  follicular: 'Follicular phase',
  ovulation:  'Ovulatory phase',
  luteal:     'Luteal phase',
};

// Activity descriptors — shown as the caption, never as the phase name.
const PHASE_THEME_LABELS: Record<PhaseKey, string> = {
  menstrual:  'Reflect & Plan',
  follicular: 'Create & Start',
  ovulation:  'Pitch & Present',
  luteal:     'Execute & Finish',
};

const PHASE_ICONS: Record<PhaseKey, string> = {
  menstrual:  '🌑',
  follicular: '🌱',
  ovulation:  '🌕',
  luteal:     '🍂',
};

export function PhaseTasksModal({ window: win, role, onClose }: Props) {
  if (!win) return null;

  const tasks = getTasksForPhaseAndRole(win.phase, role);
  const phaseColor = phaseColors[win.phase].base;
  const phaseDeep  = phaseColors[win.phase].deep;
  const roleLabel  = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? 'you';

  return (
    <Modal
      visible={!!win}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Phase header */}
          <View style={[styles.phaseHeader, { backgroundColor: phaseColor + '18' }]}>
            <Text style={styles.phaseIcon}>{PHASE_ICONS[win.phase]}</Text>
            <View style={styles.phaseHeaderText}>
              <Text style={[styles.phaseLabel, { color: phaseDeep }]}>
                {PHASE_LABELS[win.phase]}
              </Text>
              <Text style={styles.phaseCaption}>
                {PHASE_THEME_LABELS[win.phase]}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            What works for <Text style={[styles.subtitleRole, { color: phaseDeep }]}>{roleLabel}</Text> this phase
          </Text>

          {/* Task list */}
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {tasks.map((task, i) => (
              <Animated.View
                key={task.label}
                entering={FadeInDown.delay(i * 60).duration(300)}
                style={[styles.taskRow, { borderLeftColor: phaseColor }]}
              >
                <View style={[styles.taskNum, { backgroundColor: phaseColor + '22' }]}>
                  <Text style={[styles.taskNumText, { color: phaseDeep }]}>{i + 1}</Text>
                </View>
                <View style={styles.taskText}>
                  <Text style={styles.taskLabel}>{task.label}</Text>
                  <Text style={styles.taskHint}>{task.hint}</Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              ✦ These suggestions update automatically as your phase changes
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FAF8F4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: dash.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  phaseIcon: { fontSize: 28 },
  phaseHeaderText: { flex: 1 },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  phaseCaption: {
    fontSize: 12,
    color: dash.inkSoft,
    marginTop: 2,
  },
  closeBtn: { fontSize: 16, color: dash.muted, paddingRight: 4 },
  subtitle: {
    fontSize: 14,
    color: dash.inkSoft,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  subtitleRole: { fontWeight: '700' },
  list: { marginHorizontal: 20 },
  listContent: { gap: 10, paddingBottom: 8 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
  },
  taskNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskNumText: { fontSize: 13, fontWeight: '800' },
  taskText: { flex: 1, gap: 3 },
  taskLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: dash.ink,
    lineHeight: 21,
  },
  taskHint: {
    fontSize: 12,
    color: dash.muted,
    lineHeight: 17,
  },
  footer: {
    marginHorizontal: 20,
    marginTop: 14,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: dash.muted,
    textAlign: 'center',
  },
});

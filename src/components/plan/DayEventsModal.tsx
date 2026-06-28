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
import { format } from 'date-fns';
import { dash, phaseColors } from '@/theme';
import { fromISODate } from '@/lib/dates';
import {
  TASK_SYNC_CATEGORIES,
  scoreForDate,
  type ScoreColor,
} from '@/lib/intelligence/taskScore';
import {
  PHASE_CONTEXT,
  type CapacityPhase,
} from '@/lib/intelligence/capacity';
import type { CalendarEvent } from '@/lib/stores/useCalendar';
import type { Prediction } from '@/types/models';
import { Icon } from '@/components/dashboard/Icon';

// ── Exact same SCORE_UI as task-sync.tsx ────────────────────────────────────
const SCORE_UI: Record<ScoreColor, { fg: string; bg: string; glyph: string; word: string }> = {
  green: { fg: '#56723F', bg: '#E8EFE1', glyph: '✓', word: 'Great timing' },
  amber: { fg: '#B07A2E', bg: '#F6E9D4', glyph: '!', word: 'Manageable' },
  red:   { fg: '#C2683F', bg: '#F7E3D9', glyph: '⚑', word: 'Tough window' },
};

const PHASE_NAME: Record<CapacityPhase, string> = {
  menstrual:    'Menstrual',
  follicular:   'Follicular',
  ovulatory:    'Ovulatory',
  luteal_early: 'early Luteal',
  luteal_late:  'late Luteal',
};

interface Props {
  dateISO: string | null;
  events: CalendarEvent[];
  prediction: Prediction;
  onClose: () => void;
}

function scoreMessage(score: ScoreColor, phaseName: string): string {
  if (score === 'green')
    return `You'll be in your ${phaseName} phase — a strong window for this.`;
  if (score === 'amber')
    return `You'll be in your ${phaseName} phase — manageable, but not your peak.`;
  return `You'll be in your ${phaseName} phase — a low-capacity window. Consider rescheduling.`;
}

export function DayEventsModal({ dateISO, events, prediction, onClose }: Props) {
  if (!dateISO) return null;

  const dateLabel = format(fromISODate(dateISO), 'EEEE, d MMMM');
  const hasRedEvent = events.some((e) => {
    const r = scoreForDate(e.categoryId, dateISO, prediction);
    return r.score === 'red';
  });

  return (
    <Modal visible={!!dateISO} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.dateLabel}>{dateLabel}</Text>
              <Text style={styles.eventCount}>
                {events.length === 0
                  ? 'No events'
                  : `${events.length} event${events.length > 1 ? 's' : ''} scheduled`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Red warning banner */}
          {hasRedEvent && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚑ One or more events fall on a tough window. See suggestions below.
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {events.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyText}>No events scheduled for this day.</Text>
              </View>
            ) : (
              events.map((event, i) => {
                const cat = TASK_SYNC_CATEGORIES.find((c) => c.id === event.categoryId);
                const { phase, score } = scoreForDate(event.categoryId, dateISO, prediction);
                const isPersonal = score === null;
                const ui = score ? SCORE_UI[score] : null;
                const phaseName = PHASE_NAME[phase];

                return (
                  <Animated.View
                    key={event.id}
                    entering={FadeInDown.delay(i * 60).duration(300)}
                    style={[
                      styles.eventCard,
                      ui && { borderLeftColor: ui.fg, borderLeftWidth: 3 },
                      isPersonal && { borderLeftColor: dash.muted, borderLeftWidth: 3 },
                    ]}
                  >
                    {/* Event row */}
                    <View style={styles.eventTop}>
                      <View style={[styles.iconWrap, { backgroundColor: (ui?.bg ?? '#F4F0EA') }]}>
                        <Icon name={cat?.icon ?? 'grid'} color={ui?.fg ?? dash.muted} size={18} />
                      </View>
                      <View style={styles.eventMeta}>
                        <Text style={styles.eventTitle} numberOfLines={1}>
                          {event.isPrivate ? '(Private)' : event.title}
                        </Text>
                        <Text style={styles.eventTime}>
                          {cat?.label ?? 'Event'} · {event.timeLabel}
                        </Text>
                      </View>
                      {/* Score badge */}
                      {isPersonal ? (
                        <View style={[styles.scoreBadge, { backgroundColor: '#F4F0EA' }]}>
                          <Text style={[styles.scoreBadgeText, { color: dash.muted }]}>Private</Text>
                        </View>
                      ) : (
                        <View style={[styles.scoreBadge, { backgroundColor: ui!.bg }]}>
                          <Text style={[styles.scoreGlyph, { color: ui!.fg }]}>{ui!.glyph}</Text>
                          <Text style={[styles.scoreBadgeText, { color: ui!.fg }]}>{ui!.word}</Text>
                        </View>
                      )}
                    </View>

                    {/* Score message */}
                    {!isPersonal && (
                      <Text style={[styles.scoreMsg, { color: ui!.fg + 'CC' }]}>
                        {scoreMessage(score!, phaseName)}
                      </Text>
                    )}
                    {isPersonal && (
                      <Text style={styles.scoreMsgMuted}>
                        You have something personal on this day. {PHASE_CONTEXT[phase]}. Build buffer time around it.
                      </Text>
                    )}
                  </Animated.View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              ✦ Scores update automatically as your cycle progresses
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
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dateLabel: { fontSize: 19, fontWeight: '800', color: dash.ink, letterSpacing: -0.3 },
  eventCount: { fontSize: 13, color: dash.muted, marginTop: 2 },
  closeBtn: { fontSize: 16, color: dash.muted },
  warningBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#F7E3D9',
    borderRadius: 12,
    padding: 12,
  },
  warningText: { fontSize: 13, color: '#C2683F', fontWeight: '600' },
  list: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: dash.muted },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#2E2A26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMeta: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: dash.ink },
  eventTime: { fontSize: 12, color: dash.muted, marginTop: 2 },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scoreGlyph: { fontSize: 11, fontWeight: '800' },
  scoreBadgeText: { fontSize: 11, fontWeight: '700' },
  scoreMsg: { fontSize: 12, lineHeight: 17 },
  scoreMsgMuted: { fontSize: 12, lineHeight: 17, color: dash.muted },
  footer: { paddingHorizontal: 20, paddingTop: 12, alignItems: 'center' },
  footerNote: { fontSize: 12, color: dash.muted },
});

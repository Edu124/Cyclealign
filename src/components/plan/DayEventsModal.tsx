import { useState } from 'react';
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
import { dash } from '@/theme';
import { addDaysISO, fromISODate } from '@/lib/dates';
import { TASK_SYNC_CATEGORIES, type ScoreColor } from '@/lib/intelligence/taskScore';
import type { CalendarEvent } from '@/lib/stores/useCalendar';
import { useTasks } from '@/lib/stores/useTasks';
import { useAdaptivePrefs } from '@/lib/stores/useAdaptivePrefs';
import { Icon } from '@/components/dashboard/Icon';
import { TaskGuidanceCard } from '@/components/wellness/TaskGuidanceCard';
import { taskGuidanceFor } from '@/lib/wellness/taskGuidance';
import { moveWithConfirmation } from '@/lib/calendarMoveUi';
import { useAdaptive } from '@/lib/adaptive/useAdaptive';
import { formatMinutes, type DecisionWindow } from '@/lib/adaptive/windows';

// ── Exact same SCORE_UI as task-sync.tsx ────────────────────────────────────
const SCORE_UI: Record<ScoreColor, { fg: string; bg: string; glyph: string; word: string }> = {
  green: { fg: '#56723F', bg: '#E8EFE1', glyph: '✓', word: 'Great timing' },
  amber: { fg: '#B07A2E', bg: '#F6E9D4', glyph: '!', word: 'Manageable' },
  red:   { fg: '#C2683F', bg: '#F7E3D9', glyph: '⚑', word: 'Tough window' },
};

interface Props {
  dateISO: string | null;
  events: CalendarEvent[];
  onClose: () => void;
}

/** A task created via Task Sync surfaces here too (plan.tsx merges them in) — its id is prefixed so we can tell it apart from a read-only synced calendar event. */
function taskIdOf(eventId: string): string | null {
  return eventId.startsWith('task-') ? eventId.slice('task-'.length) : null;
}

function scoreMessage(score: ScoreColor, phaseName: string): string {
  if (score === 'green')
    return `You'll be in your ${phaseName} phase — a strong window for this.`;
  if (score === 'amber')
    return `You'll be in your ${phaseName} phase — manageable, but not your peak.`;
  return `You'll be in your ${phaseName} phase — this may ask more of you than the day naturally gives.`;
}

const windowKey = (eventId: string, w: DecisionWindow) => `${eventId}|${w.dateISO}|${w.startMin}`;

export function DayEventsModal({ dateISO, events, onClose }: Props) {
  const updateTaskDate = useTasks((s) => s.updateTaskDate);
  const ignored = useAdaptivePrefs((s) => s.ignored);
  const ignoreSuggestion = useAdaptivePrefs((s) => s.ignoreSuggestion);
  const { scorer, mode, rank } = useAdaptive();
  const [openPopupEventId, setOpenPopupEventId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  if (!dateISO) return null;
  const adaptive = mode !== 'regular';

  async function moveEventTo(event: CalendarEvent, newDate: string, startMin?: number) {
    if (movingId) return;
    setMovingId(event.id);
    try {
      await moveWithConfirmation(event, newDate, startMin);
    } finally {
      setMovingId(null);
    }
  }

  const dateLabel = format(fromISODate(dateISO), 'EEEE, d MMMM');
  const popupEvent = events.find((e) => e.id === openPopupEventId);
  const popupResult = popupEvent ? scorer.scoreFor(popupEvent.categoryId, dateISO, popupEvent.title) : null;
  const hasRedEvent = events.some((e) => scorer.scoreFor(e.categoryId, dateISO, e.title).score === 'red');

  return (
    <>
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
                {adaptive
                  ? '⚑ One or more events may ask more of you than this day supports. See suggestions below.'
                  : '⚑ One or more events fall on a tough window. See suggestions below.'}
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
                const ds = scorer.scoreFor(event.categoryId, dateISO, event.title);
                const score = ds.score;
                const isPrivateEvent = event.categoryId === 'PERSONAL';
                const insufficient = ds.level === 'INSUFFICIENT_DATA';
                const ui = score ? SCORE_UI[score] : null;
                const taskId = taskIdOf(event.id);

                const needsAttention = score === 'red' || score === 'amber';
                // Regular mode: next green dates (unchanged). Adaptive: real time slots
                // from her own pattern, minus anything she has already said no to.
                const betterDates = !adaptive && needsAttention ? scorer.betterDates(event.categoryId, 2) : [];
                const windows: DecisionWindow[] =
                  adaptive && needsAttention && !isPrivateEvent
                    ? rank(event.categoryId, event.title, {
                        excludeDateISO: dateISO,
                        days: 10,
                        durationMin:
                          event.startMin !== undefined && event.endMin !== undefined ? event.endMin - event.startMin : undefined,
                      })
                        .filter((w) => !ignored[windowKey(event.id, w)])
                        .slice(0, 2)
                    : [];

                return (
                  <Animated.View
                    key={event.id}
                    entering={FadeInDown.delay(i * 60).duration(300)}
                    style={[
                      styles.eventCard,
                      ui && { borderLeftColor: ui.fg, borderLeftWidth: 3 },
                      (isPrivateEvent || insufficient) && { borderLeftColor: dash.muted, borderLeftWidth: 3 },
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
                      {isPrivateEvent ? (
                        <View style={[styles.scoreBadge, { backgroundColor: '#F4F0EA' }]}>
                          <Text style={[styles.scoreBadgeText, { color: dash.muted }]}>Private</Text>
                        </View>
                      ) : insufficient ? (
                        <View style={[styles.scoreBadge, { backgroundColor: '#F4F0EA' }]}>
                          <Text style={[styles.scoreBadgeText, { color: dash.muted }]}>Still learning</Text>
                        </View>
                      ) : (
                        <View style={[styles.scoreBadge, { backgroundColor: ui!.bg }]}>
                          <Text style={[styles.scoreGlyph, { color: ui!.fg }]}>{ui!.glyph}</Text>
                          <Text style={[styles.scoreBadgeText, { color: ui!.fg }]}>{ui!.word}</Text>
                        </View>
                      )}
                    </View>

                    {/* Score message */}
                    {!isPrivateEvent && !insufficient && score && (
                      <Text style={[styles.scoreMsg, { color: ui!.fg + 'CC' }]}>
                        {ds.note ?? scoreMessage(score, ds.phaseLabel)}
                      </Text>
                    )}
                    {insufficient && (
                      <Text style={styles.scoreMsgMuted}>{ds.note}</Text>
                    )}
                    {isPrivateEvent && (
                      <Text style={styles.scoreMsgMuted}>
                        You have something personal on this day. Build buffer time around it.
                      </Text>
                    )}

                    {/* Regular mode: next best dates. Tapping moves a task inside the app, or a
                        synced calendar event in its real calendar (after a confirmation). */}
                    {betterDates.length > 0 && (
                      <View style={styles.betterDates}>
                        <Text style={styles.betterDatesLabel}>
                          {movingId === event.id ? '✦ Moving…' : '✦ Better windows — tap to move it'}
                        </Text>
                        <View style={styles.dateChips}>
                          {betterDates.map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[styles.dateChip, movingId === event.id && { opacity: 0.5 }]}
                              disabled={!!movingId}
                              onPress={() => (taskId ? updateTaskDate(taskId, d) : moveEventTo(event, d))}
                            >
                              <Text style={styles.dateChipText}>
                                {format(fromISODate(d), 'EEE, d MMM')}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Adaptive modes: real windows with the reason, and a way to say no. */}
                    {windows.length > 0 && (
                      <View style={styles.betterDates}>
                        <Text style={styles.betterDatesLabel}>
                          {movingId === event.id ? '✦ Moving…' : '✦ Stronger windows — you decide'}
                        </Text>
                        {windows.map((w) => (
                          <View key={windowKey(event.id, w)} style={styles.windowRow}>
                            <TouchableOpacity
                              style={[styles.dateChip, movingId === event.id && { opacity: 0.5 }]}
                              disabled={!!movingId}
                              onPress={() =>
                                taskId ? updateTaskDate(taskId, w.dateISO) : moveEventTo(event, w.dateISO, w.startMin)
                              }
                            >
                              <Text style={styles.dateChipText}>
                                {format(fromISODate(w.dateISO), 'EEE, d MMM')} · {formatMinutes(w.startMin)}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => ignoreSuggestion(windowKey(event.id, w))} hitSlop={8}>
                              <Text style={styles.ignoreText}>Ignore</Text>
                            </TouchableOpacity>
                            <Text style={styles.windowWhy}>{w.reasons.join(' · ')}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Same guidance flow as Task Sync: tap to reveal the
                        phase-aware PREPARE/PERFORM/RECOVER card — "keep this
                        date anyway" framing for amber/red, "make the most of
                        it" framing for a green (ideal) event. */}
                    {needsAttention && (
                      <TouchableOpacity
                        style={styles.keepBtn}
                        onPress={() => setOpenPopupEventId(event.id)}
                      >
                        <Text style={styles.keepBtnText}>Keep this date anyway</Text>
                      </TouchableOpacity>
                    )}
                    {!isPrivateEvent && score === 'green' && (
                      <TouchableOpacity
                        style={styles.keepBtn}
                        onPress={() => setOpenPopupEventId(event.id)}
                      >
                        <Text style={styles.keepBtnText}>See how to make the most of it</Text>
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerNote}>
              {adaptive
                ? '✦ Suggestions come from your own check-ins — you always decide'
                : '✦ Scores update automatically as your cycle progresses'}
            </Text>
          </View>
        </View>
      </View>

      {/* Rendered inside the sheet's Modal: iOS won't present a second modal
          opened from a sibling, so the popup silently never appeared there. */}
      {popupEvent && popupResult && popupResult.score && popupResult.guidancePhase && (
        <TaskGuidanceCard
          visible
          variant={popupResult.score === 'green' ? 'ideal' : 'blocked'}
          categoryLabel={
            TASK_SYNC_CATEGORIES.find((c) => c.id === popupEvent.categoryId)?.label ?? 'Event'
          }
          phaseName={popupResult.phaseLabel}
          phaseRowLabel={popupResult.phaseRowLabel}
          approach={popupResult.approach}
          guidance={taskGuidanceFor(popupEvent.categoryId, popupResult.guidancePhase)}
          color={SCORE_UI[popupResult.score].fg}
          onConfirm={() => setOpenPopupEventId(null)}
          onClose={() => setOpenPopupEventId(null)}
        />
      )}
    </Modal>

    </>
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
  betterDates: { gap: 6, marginTop: 2 },
  betterDatesLabel: { fontSize: 11, fontWeight: '700', color: '#56723F', letterSpacing: 0.5 },
  dateChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dateChip: {
    backgroundColor: '#E8EFE1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dateChipText: { fontSize: 13, fontWeight: '700', color: '#3A5C2C' },
  windowRow: { gap: 4, marginTop: 4 },
  ignoreText: { fontSize: 12, color: dash.muted, fontWeight: '600', marginTop: 2 },
  windowWhy: { fontSize: 11.5, color: dash.inkSoft, lineHeight: 16 },
  keepBtn: {
    alignSelf: 'flex-start',
    backgroundColor: dash.bg,
    borderWidth: 1.5,
    borderColor: dash.line,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  keepBtnText: { fontSize: 13, fontWeight: '700', color: dash.ink },
  footer: { paddingHorizontal: 20, paddingTop: 12, alignItems: 'center' },
  footerNote: { fontSize: 12, color: dash.muted },
});

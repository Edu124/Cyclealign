import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format } from 'date-fns';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { fromISODate } from '@/lib/dates';
import { useCalendar, type CalendarEvent } from '@/lib/stores/useCalendar';
import { useTasks } from '@/lib/stores/useTasks';
import { useAdaptivePrefs } from '@/lib/stores/useAdaptivePrefs';
import { categoryById } from '@/lib/intelligence/taskScore';
import { moveWithConfirmation } from '@/lib/calendarMoveUi';
import { useAdaptive } from '@/lib/adaptive/useAdaptive';
import { buildDayPlan, type DayPlanItem } from '@/lib/adaptive/dayPlan';
import { formatMinutes, type DecisionWindow } from '@/lib/adaptive/windows';
import { LEVEL_LABEL } from '@/lib/adaptive/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LEVEL_COLOR: Record<string, string> = {
  STRONG: '#56723F',
  GOOD: '#6E8B5E',
  NEUTRAL: '#B07A2E',
  PROTECT: '#C2683F',
  INSUFFICIENT_DATA: dash.muted,
};

const key = (id: string, w: DecisionWindow) => `${id}|${w.dateISO}|${w.startMin}`;

/** "Optimize My Day" — advice for today's list. Every change is her call. */
export function OptimizeDayModal({ visible, onClose }: Props) {
  const { ctx, rank, todayISO } = useAdaptive();
  const calendarEvents = useCalendar((s) => s.events);
  const tasks = useTasks((s) => s.tasks);
  const updateTaskDate = useTasks((s) => s.updateTaskDate);
  const ignored = useAdaptivePrefs((s) => s.ignored);
  const ignoreSuggestion = useAdaptivePrefs((s) => s.ignoreSuggestion);
  const [busy, setBusy] = useState<string | null>(null);

  // Today's calendar events plus tasks she planned for today (tasks have no clock time).
  const todays: CalendarEvent[] = useMemo(() => {
    const fromTasks: CalendarEvent[] = tasks
      .filter((t) => t.dateISO === todayISO && !t.done)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.label?.trim() || categoryById(t.category)?.label || 'Task',
        categoryId: t.category,
        dateISO: t.dateISO,
        timeLabel: 'Planned',
        isPrivate: t.category === 'PERSONAL',
      }));
    return [...calendarEvents.filter((e) => e.dateISO === todayISO), ...fromTasks];
  }, [calendarEvents, tasks, todayISO]);

  const plan: DayPlanItem[] = useMemo(() => {
    const slot = todays.map((e) => ({
      id: e.id,
      title: e.title,
      categoryId: e.categoryId,
      dateISO: e.dateISO,
      startMin: e.startMin,
      endMin: e.endMin,
    }));
    return buildDayPlan(
      slot,
      ctx,
      (cat, title, opts) => rank(cat, title, opts),
      (ev, w) => !!ignored[key(ev.id, w)],
    );
  }, [todays, ctx, rank, ignored]);

  const insufficient = plan.some((p) => p.advice === 'learn');

  async function accept(item: DayPlanItem) {
    const w = item.window;
    if (!w || busy) return;
    const ev = todays.find((e) => e.id === item.event.id);
    if (!ev) return;
    setBusy(ev.id);
    try {
      if (ev.id.startsWith('task-')) updateTaskDate(ev.id.slice(5), w.dateISO);
      else await moveWithConfirmation(ev, w.dateISO, w.startMin);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Optimize My Day</Text>
              <Text style={styles.sub}>Suggestions only — nothing changes unless you say so.</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {insufficient && (
              <View style={styles.note}>
                <Text style={styles.noteText}>
                  We're still learning your pattern. For now we'll use today's energy, sleep, focus and symptoms to structure your day — add today's check-in for sharper advice.
                </Text>
              </View>
            )}

            {plan.length === 0 ? (
              <Text style={styles.empty}>Nothing on your list today. A good day to protect some focus time.</Text>
            ) : (
              plan.map((item, i) => {
                const color = item.level ? LEVEL_COLOR[item.level] : dash.muted;
                return (
                  <View key={item.event.id} style={styles.card}>
                    <View style={styles.row}>
                      <Text style={styles.num}>{i + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name} numberOfLines={1}>{item.event.title}</Text>
                        {item.event.startMin !== undefined && (
                          <Text style={styles.time}>{formatMinutes(item.event.startMin)}</Text>
                        )}
                      </View>
                      {item.level && item.advice !== 'private' && (
                        <View style={[styles.chip, { backgroundColor: color + '22' }]}>
                          <Text style={[styles.chipText, { color }]}>{LEVEL_LABEL[item.level]}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.headline}>{item.headline}</Text>
                    {item.reasons.length > 0 && item.advice !== 'learn' && (
                      <Text style={styles.why}>{item.reasons.join(' · ')}</Text>
                    )}

                    {item.window && (
                      <View style={styles.windowBox}>
                        <Text style={styles.windowTitle}>
                          {format(fromISODate(item.window.dateISO), 'EEE, d MMM')} · {formatMinutes(item.window.startMin)}
                          {'  '}({LEVEL_LABEL[item.window.readinessLevel]})
                        </Text>
                        <Text style={styles.why}>{item.window.reasons.join(' · ')}</Text>
                        <View style={styles.actions}>
                          <Pressable
                            style={[styles.primary, busy === item.event.id && { opacity: 0.5 }]}
                            disabled={!!busy}
                            onPress={() => accept(item)}
                          >
                            <Text style={styles.primaryText}>Move it</Text>
                          </Pressable>
                          <Pressable
                            style={styles.secondary}
                            onPress={() => ignoreSuggestion(key(item.event.id, item.window as DecisionWindow))}
                          >
                            <Text style={styles.secondaryText}>Ignore</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#FAF8F4', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: 24, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: dash.line, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 10 },
  title: { fontFamily: fonts.heading, fontSize: 20, color: dash.ink },
  sub: { fontSize: 12.5, color: dash.muted, marginTop: 2 },
  close: { fontSize: 16, color: dash.muted },
  list: { paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
  note: { backgroundColor: dash.sageTint, borderRadius: 14, padding: 12 },
  noteText: { fontSize: 13, color: dash.inkSoft, lineHeight: 19 },
  empty: { fontSize: 14, color: dash.muted, paddingVertical: 20, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { fontSize: 15, fontWeight: '800', color: dash.muted },
  name: { fontSize: 15, fontWeight: '700', color: dash.ink },
  time: { fontSize: 12, color: dash.muted, marginTop: 1 },
  chip: { borderRadius: 14, paddingVertical: 4, paddingHorizontal: 9 },
  chipText: { fontSize: 11, fontWeight: '800' },
  headline: { fontSize: 13.5, fontWeight: '600', color: dash.ink },
  why: { fontSize: 12, color: dash.inkSoft, lineHeight: 17 },
  windowBox: { backgroundColor: dash.sageTint, borderRadius: 12, padding: 12, gap: 6, marginTop: 4 },
  windowTitle: { fontSize: 13.5, fontWeight: '800', color: dash.sageDeep },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primary: { backgroundColor: dash.sage, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  secondary: { borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1.5, borderColor: dash.line },
  secondaryText: { color: dash.inkSoft, fontWeight: '700', fontSize: 13 },
});

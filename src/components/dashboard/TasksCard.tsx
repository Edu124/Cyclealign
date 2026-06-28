import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Prediction } from '@/types/models';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { ScoreColor, categoryById, scoreForDate } from '@/lib/intelligence/taskScore';
import { useTasks, tasksForDate } from '@/lib/stores/useTasks';
import { Icon } from './Icon';

interface Props {
  prediction: Prediction;
  dateISO: string;
}

const SCORE_STYLE: Record<ScoreColor, { color: string; glyph: string }> = {
  green: { color: '#56723F', glyph: '✓' },
  amber: { color: '#B07A2E', glyph: '!' },
  red: { color: '#C2683F', glyph: '⚑' },
};

/** Component D — Today's Tasks (up to 3). Add task opens the Task Sync flow. */
export function TasksCard({ prediction, dateISO }: Props) {
  const tasks = useTasks((s) => s.tasks);
  const removeTask = useTasks((s) => s.removeTask);
  const todays = tasksForDate(tasks, dateISO).slice(0, 3);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today's Tasks</Text>

      {todays.length === 0 ? (
        <Text style={styles.empty}>No tasks planned for today.</Text>
      ) : (
        <View style={styles.list}>
          {todays.map((t) => {
            const cat = categoryById(t.category);
            const { score } = scoreForDate(t.category, t.dateISO, prediction);
            const s = score ? SCORE_STYLE[score] : null;
            return (
              <Pressable key={t.id} onLongPress={() => removeTask(t.id)} style={styles.task}>
                <View style={styles.taskIcon}>
                  <Icon name={cat?.icon ?? 'grid'} color={dash.sage} size={18} />
                </View>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {t.label?.trim() || cat?.label || 'Task'}
                </Text>
                {s ? (
                  <View style={[styles.badge, { backgroundColor: `${s.color}22` }]}>
                    <Text style={[styles.badgeGlyph, { color: s.color }]}>{s.glyph}</Text>
                  </View>
                ) : (
                  <View style={styles.badge}>
                    <Icon name="lock" color={dash.muted} size={14} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable style={styles.addBtn} onPress={() => router.push('/task-sync')}>
        <Text style={styles.addPlus}>＋</Text>
        <Text style={styles.addText}>Add task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dash.card,
    borderRadius: 22,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: dash.line,
  },
  title: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink },
  empty: { fontSize: 14, color: dash.muted },
  list: { gap: 10 },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: dash.bg,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  taskIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: dash.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: { flex: 1, fontSize: 15, color: dash.ink, fontWeight: '500' },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeGlyph: { fontSize: 14, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: dash.sage,
    borderStyle: 'dashed',
    paddingVertical: 12,
  },
  addPlus: { fontSize: 18, color: dash.sage, fontWeight: '800' },
  addText: { fontSize: 15, color: dash.sage, fontWeight: '700' },
});

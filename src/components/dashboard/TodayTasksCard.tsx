import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { dash } from '@/theme';
import { fonts } from '@/theme/fonts';
import { categoryById } from '@/lib/intelligence/taskScore';
import { useTasks, tasksForDate } from '@/lib/stores/useTasks';
import { Icon } from './Icon';

interface Props {
  dateISO: string;
}

/** Today's Tasks list — checkbox + category icon + label + star. */
export function TodayTasksCard({ dateISO }: Props) {
  const tasks = useTasks((s) => s.tasks);
  const toggleDone = useTasks((s) => s.toggleDone);
  const toggleStar = useTasks((s) => s.toggleStar);
  const removeTask = useTasks((s) => s.removeTask);
  const todays = tasksForDate(tasks, dateISO);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Tasks</Text>
        <Pressable style={styles.add} onPress={() => router.push('/task-sync')} hitSlop={8}>
          <Text style={styles.addText}>＋ Add Task</Text>
        </Pressable>
      </View>

      {todays.length === 0 ? (
        <Text style={styles.empty}>No tasks yet — add one for today.</Text>
      ) : (
        <View style={styles.list}>
          {todays.map((t) => {
            const cat = categoryById(t.category);
            return (
              <Pressable key={t.id} onLongPress={() => removeTask(t.id)} style={styles.row}>
                <Pressable onPress={() => toggleDone(t.id)} hitSlop={8}>
                  <View style={[styles.check, t.done && styles.checkDone]}>
                    {t.done && <Icon name="check" color="#FFFFFF" size={14} strokeWidth={2.6} />}
                  </View>
                </Pressable>

                <View style={styles.taskIcon}>
                  <Icon name={cat?.icon ?? 'grid'} color={dash.sage} size={17} />
                </View>

                <Text style={[styles.taskTitle, t.done && styles.taskDone]} numberOfLines={1}>
                  {t.label?.trim() || cat?.label || 'Task'}
                </Text>

                <Pressable onPress={() => toggleStar(t.id)} hitSlop={8}>
                  <Icon
                    name={t.starred ? 'starFill' : 'star'}
                    color={t.starred ? '#E0A85C' : dash.muted}
                    size={20}
                  />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.heading, fontSize: 18, color: dash.ink },
  add: {},
  addText: { fontSize: 14, fontWeight: '700', color: dash.sage },
  empty: { fontSize: 14, color: dash.muted },
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: dash.line,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: dash.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: dash.sage, borderColor: dash.sage },
  taskIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: dash.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: { flex: 1, fontSize: 15, color: dash.ink, fontWeight: '500' },
  taskDone: { textDecorationLine: 'line-through', color: dash.muted },
});

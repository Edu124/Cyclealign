import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Task {
  id: string;
  category: string; // TaskSyncCategory id (privacy-first: no task name)
  dateISO: string; // the day this task is planned for
  label?: string; // optional private label, max 40 chars, local only
  done?: boolean;
  starred?: boolean;
}

interface TasksState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  removeTask: (id: string) => void;
  toggleDone: (id: string) => void;
  toggleStar: (id: string) => void;
}

export const useTasks = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) =>
        set((s) => ({
          tasks: [...s.tasks, { ...task, id: `task-${Date.now()}` }],
        })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleDone: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      toggleStar: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)),
        })),
    }),
    {
      name: 'cyclealign-tasks',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function tasksForDate(tasks: Task[], dateISO: string): Task[] {
  return tasks.filter((t) => t.dateISO === dateISO);
}

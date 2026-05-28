import { create } from 'zustand';
import {
  completeHousekeepingTask,
  fetchHousekeepingTasks,
  updateHousekeepingTask,
  type ApiHousekeepingTask,
} from '@/lib/protectedEndpoints';

interface HousekeepingStore {
  tasks: ApiHousekeepingTask[];
  isLoading: boolean;
  error: string;
  fetchTasks: (params?: Record<string, string | number>) => Promise<void>;
  updateTask: (taskId: number, data: Record<string, unknown>) => Promise<void>;
  completeTask: (taskId: number) => Promise<void>;
}

export const useHousekeepingStore = create<HousekeepingStore>((set) => ({
  tasks: [],
  isLoading: false,
  error: '',

  fetchTasks: async (params) => {
    set({ isLoading: true, error: '' });

    try {
      const response = await fetchHousekeepingTasks(params);
      const payload = Array.isArray(response.data) ? response.data : response.data.data;
      set({ tasks: payload, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Live housekeeping data unavailable. Showing cached demo data.',
      });
    }
  },

  updateTask: async (taskId, data) => {
    try {
      const response = await updateHousekeepingTask(taskId, data);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? response.data : task)),
        error: '',
      }));
    } catch {
      set({ error: 'Could not update housekeeping task on the backend. Local status was updated only.' });
      throw new Error('Failed to update housekeeping task.');
    }
  },

  completeTask: async (taskId) => {
    try {
      const response = await completeHousekeepingTask(taskId);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? response.data : task)),
        error: '',
      }));
    } catch {
      set({ error: 'Could not update housekeeping task on the backend. Local status was updated only.' });
      throw new Error('Failed to complete housekeeping task.');
    }
  },
}));

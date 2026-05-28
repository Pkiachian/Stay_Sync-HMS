import { create } from 'zustand';
import { fetchDashboardStats, type DashboardStatsResponse } from '@/lib/protectedEndpoints';

interface DashboardStore {
  stats: DashboardStatsResponse | null;
  isLoading: boolean;
  error: string;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,
  error: '',

  fetchStats: async () => {
    set({ isLoading: true, error: '' });

    try {
      const response = await fetchDashboardStats();
      set({ stats: response.data, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Live dashboard data unavailable. Showing cached demo data.',
      });
    }
  },
}));

import { create } from 'zustand';
import { fetchDashboardStats, fetchBookings, type DashboardStatsResponse, type ApiBooking } from '@/lib/protectedEndpoints';

interface DashboardStore {
  stats: DashboardStatsResponse | null;
  arrivals: ApiBooking[];
  isLoading: boolean;
  error: string;
  fetchStats: () => Promise<void>;
  fetchArrivals: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  arrivals: [],
  isLoading: false,
  error: '',

  fetchStats: async () => {
    set({ isLoading: true, error: '' });
    try {
      const response = await fetchDashboardStats();
      const payload = 'data' in response.data ? response.data.data : response.data;
      set({ stats: payload, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Live dashboard data unavailable.' });
    }
  },

  fetchArrivals: async () => {
    set({ isLoading: true, error: '' });
    try {
      const response = await fetchBookings();
      const list: ApiBooking[] = Array.isArray(response.data) ? response.data : response.data.data ?? [];
      const today = new Date().toISOString().slice(0, 10);
      const arrivals = list.filter((b) => String(b.check_in_date).slice(0, 10) === today);
      set({ arrivals, isLoading: false });
    } catch {
      set({ arrivals: [], isLoading: false, error: 'Live dashboard data unavailable.' });
    }
  },
}));

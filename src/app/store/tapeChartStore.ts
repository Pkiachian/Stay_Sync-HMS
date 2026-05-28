import { create } from 'zustand';
import { fetchTapeChart, type TapeChartResponse } from '@/lib/protectedEndpoints';

interface TapeChartStore {
  data: TapeChartResponse | null;
  isLoading: boolean;
  error: string;
  fetchTapeChart: (startDate: string, endDate: string) => Promise<void>;
}

export const useTapeChartStore = create<TapeChartStore>((set) => ({
  data: null,
  isLoading: false,
  error: '',

  fetchTapeChart: async (startDate, endDate) => {
    set({ isLoading: true, error: '' });

    try {
      const response = await fetchTapeChart(startDate, endDate);
      set({ data: response.data, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Live tape chart unavailable. Showing cached demo data.',
      });
    }
  },
}));

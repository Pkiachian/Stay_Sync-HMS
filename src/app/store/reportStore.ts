import { create } from 'zustand';
import { fetchReports } from '@/lib/protectedEndpoints';

interface ReportStore {
  reports: any;
  isLoading: boolean;
  error: string;
  fetchReports: (startDate: string, endDate: string, groupBy?: string) => Promise<void>;
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: null,
  isLoading: false,
  error: '',

  fetchReports: async (startDate, endDate, groupBy = 'day') => {
    set({ isLoading: true, error: '' });

    try {
      const response = await fetchReports(startDate, endDate, groupBy);
      set({ reports: response.data, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Live reports unavailable. Showing cached demo reports.',
      });
    }
  },
}));

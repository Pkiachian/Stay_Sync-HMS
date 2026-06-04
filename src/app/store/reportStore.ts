import { create } from 'zustand';
import {
  fetchRevenueReport,
  fetchBookingsReport,
  fetchOccupancyReport,
  fetchMonthlyRevenueReport,
  fetchMonthlyBookingsReport,
  type RevenueReport,
  type BookingsReport,
  type OccupancyReport,
  type MonthlyRevenueRow,
  type MonthlyBookingsRow,
} from '@/lib/protectedEndpoints';

export interface ReportsBundle {
  revenue: RevenueReport;
  bookings: BookingsReport;
  occupancy: OccupancyReport;
  monthlyRevenue: MonthlyRevenueRow[];
  monthlyBookings: MonthlyBookingsRow[];
}

interface ReportStore {
  reports: ReportsBundle | null;
  isLoading: boolean;
  error: string;
  fetchReports: () => Promise<void>;
}

function unwrap<T>(payload: T | { data: T }): T {
  return payload && typeof payload === 'object' && 'data' in (payload as object)
    ? (payload as { data: T }).data
    : (payload as T);
}

export const useReportStore = create<ReportStore>((set) => ({
  reports: null,
  isLoading: false,
  error: '',

  fetchReports: async () => {
    set({ isLoading: true, error: '' });

    try {
      const [rev, bk, occ, mRev, mBk] = await Promise.all([
        fetchRevenueReport(),
        fetchBookingsReport(),
        fetchOccupancyReport(),
        fetchMonthlyRevenueReport(),
        fetchMonthlyBookingsReport(),
      ]);
      set({
        reports: {
          revenue: unwrap(rev.data),
          bookings: unwrap(bk.data),
          occupancy: unwrap(occ.data),
          monthlyRevenue: unwrap(mRev.data),
          monthlyBookings: unwrap(mBk.data),
        },
        isLoading: false,
      });
    } catch {
      set({
        isLoading: false,
        error: 'Live reports unavailable.',
      });
    }
  },
}));

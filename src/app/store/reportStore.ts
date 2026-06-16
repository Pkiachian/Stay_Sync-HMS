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
    } catch (err: unknown) {
      // Surface the real reason so users (and the next debugger) can tell
      // whether it's a network error, 401, 403, 500, etc.
      const e = err as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = e.response?.status;
      const serverMessage = e.response?.data?.message;
      const detail =
        serverMessage
        ?? (status === 401 ? 'Your session has expired. Please sign in again.' : null)
        ?? (status === 403 ? 'Your role does not have access to reports.' : null)
        ?? (status === 0 || !status ? 'Cannot reach the backend. Is the Laravel server running?' : null)
        ?? e.message
        ?? 'Unknown error';
      set({
        isLoading: false,
        error: `Live reports unavailable — ${detail}`,
      });
    }
  },
}));

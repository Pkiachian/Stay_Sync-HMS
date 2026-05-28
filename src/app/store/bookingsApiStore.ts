import { create } from 'zustand';
import { fetchBookings, type ApiBooking } from '@/lib/protectedEndpoints';

interface BookingsApiStore {
  bookings: ApiBooking[];
  isLoading: boolean;
  error: string;
  fetchBookings: (params?: Record<string, string | number>) => Promise<void>;
}

export const useBookingsApiStore = create<BookingsApiStore>((set) => ({
  bookings: [],
  isLoading: false,
  error: '',

  fetchBookings: async (params) => {
    set({ isLoading: true, error: '' });

    try {
      const response = await fetchBookings(params);
      const payload = Array.isArray(response.data) ? response.data : response.data.data;
      set({ bookings: payload, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Live booking data unavailable. Showing cached demo bookings.',
      });
    }
  },
}));

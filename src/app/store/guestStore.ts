import { create } from 'zustand';
import { fetchGuests, type ApiGuest } from '@/lib/protectedEndpoints';

interface GuestStore {
  guests: ApiGuest[];
  isLoading: boolean;
  error: string;
  fetchGuests: (params?: Record<string, string | number>) => Promise<void>;
}

export const useGuestStore = create<GuestStore>((set) => ({
  guests: [],
  isLoading: false,
  error: '',

  fetchGuests: async (params) => {
    set({ isLoading: true, error: '' });

    try {
      const response = await fetchGuests(params);
      const payload = Array.isArray(response.data) ? response.data : response.data.data;
      set({ guests: payload, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Live guest data unavailable. Showing cached demo guests.',
      });
    }
  },
}));

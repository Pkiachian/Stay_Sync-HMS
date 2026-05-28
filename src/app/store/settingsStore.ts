import { create } from 'zustand';
import { fetchSettings } from '@/lib/protectedEndpoints';

interface SettingsStore {
  settings: Record<string, string>;
  isLoading: boolean;
  error: string;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: {},
  isLoading: false,
  error: '',

  fetchSettings: async () => {
    set({ isLoading: true, error: '' });

    try {
      const response = await fetchSettings();
      set({ settings: response.data, isLoading: false });
    } catch {
      set({
        isLoading: false,
        error: 'Live settings unavailable.',
      });
    }
  },
}));

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  activeModal: string | null;
  modalData: unknown;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  openModal: (name: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  activeModal: null,
  modalData: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
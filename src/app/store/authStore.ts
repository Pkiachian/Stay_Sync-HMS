import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User } from '@/types';

type LoginResponse = {
  data?: {
    token?: string;
    user?: User;
  };
  token?: string;
  user?: User;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/login', {
            email,
            password,
          });

          const payload = response.data as LoginResponse;
          const token = payload.data?.token ?? payload.token;
          const user = payload.data?.user ?? payload.user;

          if (!token || !user) {
            throw new Error('Login response did not include a user and token.');
          }

          localStorage.setItem('token', token);
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'staysync-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;
        const token = persisted?.token ?? null;
        const user = persisted?.user ?? null;

        return {
          ...currentState,
          ...persisted,
          token,
          user,
          isAuthenticated: Boolean(token && user),
          isLoading: false,
        };
      },
    }
  )
);

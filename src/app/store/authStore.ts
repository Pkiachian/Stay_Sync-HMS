import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/login', {
            email,
            password,
          });

          const { token, user } = response.data as { token: string; user: User };

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
    }),
    {
      name: 'staysync-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

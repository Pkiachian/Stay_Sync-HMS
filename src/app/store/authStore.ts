import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import type { User } from '@/types';

type SessionPayload = {
  user: User;
  token: string;
  role: string;
  permissions: string[];
  redirect_to: string;
};

type LoginResponse = {
  data?: Partial<SessionPayload>;
  user?: User;
  token?: string;
  role?: string;
  permissions?: string[];
  redirect_to?: string;
};

interface AuthState {
  user: User | null;
  token: string | null;
  role: string | null;
  permissions: string[];
  redirectTo: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      permissions: [],
      redirectTo: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/login', { email, password });
          const outer = response.data as LoginResponse;
          const payload = outer.data ?? outer;
          const token       = payload.token;
          const user        = payload.user;
          const role        = payload.role ?? (user?.role as string | undefined) ?? null;
          const permissions = payload.permissions ?? [];
          const redirectTo  = payload.redirect_to ?? null;

          if (!token || !user) {
            throw new Error('Login response did not include a user and token.');
          }

          localStorage.setItem('token', token);
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({ user, token, role, permissions, redirectTo, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        const currentToken = get().token;
        if (currentToken) {
          // Best-effort revoke. If the network call fails (e.g. expired token),
          // we still clear local state.
          api.post('/logout').catch(() => undefined);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        set({ user: null, token: null, role: null, permissions: [], redirectTo: null, isAuthenticated: false });
      },

      refreshSession: async () => {
        try {
          const response = await api.get('/me');
          const outer  = response.data as { data?: Partial<SessionPayload> };
          const payload = outer.data ?? {};
          set({
            user:        payload.user        ?? get().user,
            role:        payload.role        ?? get().role,
            permissions: payload.permissions ?? get().permissions,
            redirectTo:  payload.redirect_to ?? get().redirectTo,
          });
        } catch {
          // Token rejected — clear local state and let the SPA route to /login.
          localStorage.removeItem('token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          set({ user: null, token: null, role: null, permissions: [], redirectTo: null, isAuthenticated: false });
        }
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'staysync-auth',
      partialize: (state) => ({
        user:        state.user,
        token:       state.token,
        role:        state.role,
        permissions: state.permissions,
        redirectTo:  state.redirectTo,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;
        const token = persisted?.token ?? null;
        const user  = persisted?.user  ?? null;

        return {
          ...currentState,
          ...persisted,
          token,
          user,
          permissions: persisted?.permissions ?? [],
          isAuthenticated: Boolean(token && user),
          isLoading: false,
        };
      },
    }
  )
);

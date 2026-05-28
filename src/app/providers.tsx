import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { useUIStore } from './store/uiStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

export { queryClient };

export function Providers({ children }: { children: ReactNode }) {
  const theme = useUIStore((s: { theme: string }) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
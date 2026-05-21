import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import  DashboardLayout  from '@/components/layout/DashboardLayout';
import LoginPage        from '@/features/auth/LoginPage';
import DashboardPage    from '@/features/dashboard/page';
import TapeChartPage    from '@/features/tape-chart/page';
import BookingsPage     from '@/features/bookings/page';
import HousekeepingPage from '@/features/housekeeping/page';
import GuestsPage       from '@/features/guests/page';
import ReportsPage      from '@/features/reports/page';

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'housekeeping') return <Navigate to="/housekeeping" replace />;
  if (user.role === 'manager')      return <Navigate to="/reports"      replace />;
  return <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/',             element: <DashboardPage />    },
          { path: '/tape-chart',   element: <TapeChartPage />    },
          { path: '/bookings',     element: <BookingsPage />     },
          { path: '/housekeeping', element: <HousekeepingPage /> },
          { path: '/guests',       element: <GuestsPage />       },
          { path: '/reports',      element: <ReportsPage />      },
        ],
      },
    ],
  },
  { path: '*', element: <RoleRedirect /> },
]);
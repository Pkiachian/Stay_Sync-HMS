import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoginPage from '@/features/auth/LoginPage';
import PortalLayout from '@/features/portal/PortalLayout';
import PortalLandingPage from '@/features/portal/LandingPage';
import PortalBookingPage from '@/features/portal/BookingPage';
import PortalCheckInPage from '@/features/portal/CheckInPage';
import PortalDigitalKeyPage from '@/features/portal/DigitalKeyPage';
import PortalReservationsPage from '@/features/portal/ReservationsPage';
import PortalRoomServicePage from '@/features/portal/RoomServicePage';
import ConciergeInboxPage from '@/features/concierge-inbox/page';
import RoomStatusLogPage from '@/features/room-status-log/page';
import SettingsPage from '@/features/settings/page';
import RateOverridesPage from '@/features/rate-overrides/page';
import RoomServiceOrdersPage from '@/features/room-service-orders/page';
import PortalConciergePage from '@/features/portal/ConciergePage';
import PortalBillingPage from '@/features/portal/BillingPage';
import PortalLoyaltyPage from '@/features/portal/LoyaltyPage';
import PortalChatPage from '@/features/portal/ChatPage';
import PackageDetailsPage from '@/features/portal/PackageDetailsPage';
import RoomTypeDetailsPage from '@/features/portal/RoomTypeDetailsPage';
import DashboardPage from '@/features/dashboard/page';
import TapeChartPage from '@/features/tape-chart/page';
import BookingsPage from '@/features/bookings/page';
import HousekeepingPage from '@/features/housekeeping/page';
import GuestsPage from '@/features/guests/page';
import ReportsPage from '@/features/reports/page';
import AboutPage from '@/features/about/page';
import ContactPage from '@/features/contact/page';

// Each role's default landing page after login.
const ROLE_HOME: Record<string, string> = {
  admin:        '/',
  manager:      '/reports',
  receptionist: '/bookings',
  housekeeper:  '/housekeeping',
};

// Pages each role is allowed to visit. Admin gets everything, manager
// gets everything, receptionist is front-desk only, housekeeper is
// housekeeping + dashboard read-only.
const ROLE_PAGES: Record<string, string[]> = {
  admin:        ['*'],
  manager:      ['/', '/tape-chart', '/bookings', '/housekeeping', '/room-status-log', '/concierge-inbox', '/room-service-orders', '/guests', '/reports', '/rate-overrides', '/about', '/contact'],
  receptionist: ['/', '/tape-chart', '/bookings', '/concierge-inbox', '/room-service-orders', '/guests', '/about', '/contact'],
  housekeeper:  ['/', '/housekeeping', '/room-status-log', '/about', '/contact'],
};
function pageAllowed(role: string | undefined, path: string): boolean {
  if (!role) return false;
  const allowed = ROLE_PAGES[role] ?? [];
  if (allowed.includes('*')) return true;
  return allowed.includes(path);
}

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  if (!hasHydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireRole({ allow }: { allow?: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  if (!hasHydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role;
  if (!role) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? '/login'} replace />;
  }
  return <Outlet />;
}

function RoleRedirect() {
  // Unknown URL — send everyone to the portal first. Authenticated users
  // can navigate onward to their role-specific dashboard from there.
  return <Navigate to="/portal" replace />;
}

// Helper so each page declares which roles may visit it.
function roles(...rs: string[]) { return rs; }

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/portal" replace /> },
  { path: '/login', element: <LoginPage /> },
  // Public guest self-service portal — no auth required
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [
      { index: true,           element: <PortalLandingPage /> },
      { path: 'booking',       element: <PortalBookingPage /> },
      { path: 'check-in',      element: <PortalCheckInPage /> },
      { path: 'key',           element: <PortalDigitalKeyPage /> },
      { path: 'reservations',  element: <PortalReservationsPage /> },
      { path: 'room-service',  element: <PortalRoomServicePage /> },
      { path: 'concierge',     element: <PortalConciergePage /> },
      { path: 'billing',       element: <PortalBillingPage /> },
      { path: 'loyalty',       element: <PortalLoyaltyPage /> },
      { path: 'chat',          element: <PortalChatPage /> },
      { path: 'packages/:slug', element: <PackageDetailsPage /> },
      { path: 'rooms/:slug',     element: <RoomTypeDetailsPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Universal routes — visible to admin + manager + receptionist + housekeeper.
          // The top-level '/' above (outside RequireAuth) handles anonymous
          // visitors by sending them to /portal. The '/' inside this block
          // is reached only by authenticated users and renders the dashboard.
          { path: '/', element: <RequireRole />, children: [
            { index: true, element: <DashboardPage /> },
          ]},
          { path: '/about', element: <RequireRole />, children: [
            { index: true, element: <AboutPage /> },
          ]},
          { path: '/contact', element: <RequireRole />, children: [
            { index: true, element: <ContactPage /> },
          ]},
          // Front-desk pages: admin, manager, receptionist.
          { path: '/tape-chart', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [
            { index: true, element: <TapeChartPage /> },
          ]},
          { path: '/bookings', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [
            { index: true, element: <BookingsPage /> },
          ]},
          { path: '/guests', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [
            { index: true, element: <GuestsPage /> },
          ]},
          // Housekeeping: admin, manager, housekeeper.
          { path: '/housekeeping', element: <RequireRole allow={roles('admin', 'manager', 'housekeeper')} />, children: [
            { index: true, element: <HousekeepingPage /> },
          ]},
          // Reports: admin, manager.
          { path: '/reports', element: <RequireRole allow={roles('admin', 'manager')} />, children: [
            { index: true, element: <ReportsPage /> },
          ]},
          // Concierge inbox: admin, manager, receptionist.
          { path: '/concierge-inbox', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [
            { index: true, element: <ConciergeInboxPage /> },
          ]},
          // Hotel settings: admin only.
          { path: '/settings', element: <RequireRole allow={roles('admin')} />, children: [
            { index: true, element: <SettingsPage /> },
          ]},
          // Room status history: admin, manager, housekeeper.
          { path: '/room-status-log', element: <RequireRole allow={roles('admin', 'manager', 'housekeeper')} />, children: [
            { index: true, element: <RoomStatusLogPage /> },
          ]},
          // Rate overrides: admin, manager.
          { path: '/rate-overrides', element: <RequireRole allow={roles('admin', 'manager')} />, children: [
            { index: true, element: <RateOverridesPage /> },
          ]},
          // Room service orders (kitchen fulfilment): admin, manager, receptionist.
          { path: '/room-service-orders', element: <RequireRole allow={roles('admin', 'manager', 'receptionist')} />, children: [
            { index: true, element: <RoomServiceOrdersPage /> },
          ]},
        ],
      },
    ],
  },
  { path: '*', element: <RoleRedirect /> },
]);

export { ROLE_PAGES, ROLE_HOME, pageAllowed };

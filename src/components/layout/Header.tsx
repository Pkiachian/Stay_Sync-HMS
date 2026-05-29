import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Bell, CheckCheck, ClipboardCheck, Menu, Moon, Sparkles, Sun, UserCog, X } from 'lucide-react';
import { useUIStore } from '@/app/store/uiStore';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/tape-chart': 'Tape Chart',
  '/bookings': 'Bookings',
  '/housekeeping': 'Housekeeping',
  '/guests': 'Guests',
  '/reports': 'Reports',
  '/about': 'About Us',
  '/contact': 'Contact Us',
};

const NOTIFICATIONS = [
  { id: 1, title: 'New booking', message: 'James Odhiambo - Room 101, check-in today', time: '2 min ago', unread: true },
  { id: 2, title: 'Housekeeping alert', message: 'Room 205 marked dirty, needs cleaning', time: '15 min ago', unread: true },
  { id: 3, title: 'Check-out complete', message: 'Peter Otieno checked out of Room 110', time: '1 hr ago', unread: true },
  { id: 4, title: 'Payment received', message: 'Invoice #SS-2024-00120 paid - KES 54,000', time: '2 hr ago', unread: false },
  { id: 5, title: 'Maintenance request', message: 'Room 312 - AC not working, ticket raised', time: '3 hr ago', unread: false },
];

const ROLE_VIEWS = [
  { label: 'Receptionist', to: '/bookings', Icon: ClipboardCheck },
  { label: 'Manager', to: '/reports', Icon: BarChart3 },
  { label: 'Housekeeper', to: '/housekeeping', Icon: Sparkles },
  { label: 'Admin', to: '/reports', Icon: UserCog },
];

export function Header() {
  const { toggleSidebar, toggleTheme, theme, sidebarOpen } = useUIStore();
  const { pathname } = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, unread: false })));
  };

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <header className="relative z-50 flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-slate-950/46 px-4 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="flex h-9 w-9 items-center justify-center rounded-xl text-cyan-100/75 transition hover:bg-white/10 hover:text-white" aria-label="Open sidebar">
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="min-w-0">
        <p className="text-base font-bold leading-tight">{PAGE_TITLES[pathname] ?? 'StaySync'}</p>
        <p className="hidden text-[11px] text-cyan-100/58 sm:block">Live hotel operations workspace</p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="hidden items-center gap-1.5 lg:flex">
          {ROLE_VIEWS.map(({ label, to, Icon }) => (
            <Link key={label} to={to} className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-cyan-50/72 transition hover:bg-white/10 hover:text-white">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden items-center gap-1 md:flex">
        <Link to="/about" className="rounded-xl px-3 py-2 text-xs font-semibold text-cyan-50/70 transition hover:bg-white/10 hover:text-white">About Us</Link>
        <Link to="/contact" className="rounded-xl px-3 py-2 text-xs font-semibold text-cyan-50/70 transition hover:bg-white/10 hover:text-white">Contact Us</Link>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl text-cyan-50/75 transition hover:bg-white/10 hover:text-white" aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button onClick={() => setNotifOpen((open) => !open)} className="relative flex h-9 w-9 items-center justify-center rounded-xl text-cyan-50/75 transition hover:bg-white/10 hover:text-white" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-black/30 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-cyan-200 hover:underline"><CheckCheck className="h-3 w-3" />Mark all read</button>}
                  <button onClick={() => setNotifOpen(false)} className="text-cyan-100/55 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="max-h-72 divide-y divide-white/10 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-cyan-100/62">No notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className={`flex gap-3 px-4 py-3 transition hover:bg-white/8 ${notification.unread ? 'bg-cyan-400/8' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {notification.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-300" />}
                          <p className="truncate text-xs font-semibold">{notification.title}</p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-cyan-50/62">{notification.message}</p>
                        <p className="mt-1 text-[10px] text-cyan-50/45">{notification.time}</p>
                      </div>
                      <button onClick={() => dismiss(notification.id)} className="mt-0.5 shrink-0 text-cyan-100/45 hover:text-red-200"><X className="h-3 w-3" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
    </header>
  );
}

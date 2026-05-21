import { BarChart3, Bell, CheckCheck, ClipboardCheck, Menu, Moon, Settings, Sparkles, Sun, X } from 'lucide-react';
import { useUIStore } from '@/app/store/uiStore';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/tape-chart':   'Tape Chart',
  '/bookings':     'Bookings',
  '/housekeeping': 'Housekeeping',
  '/guests':       'Guests',
  '/reports':      'Reports',
};

const NOTIFICATIONS = [
  { id: 1, title: 'New booking',        message: 'James Odhiambo — Room 101, Check-in today',  time: '2 min ago',  unread: true  },
  { id: 2, title: 'Housekeeping alert', message: 'Room 205 marked dirty, needs cleaning',        time: '15 min ago', unread: true  },
  { id: 3, title: 'Check-out complete', message: 'Peter Otieno checked out of Room 110',         time: '1 hr ago',   unread: true  },
  { id: 4, title: 'Payment received',   message: 'Invoice #SS-2024-00120 paid — $540',           time: '2 hr ago',   unread: false },
  { id: 5, title: 'Maintenance request','message': 'Room 312 — AC not working, ticket raised',  time: '3 hr ago',   unread: false },
];

const DASHBOARD_VIEWS = [
  { label: 'Reception', to: '/bookings', Icon: ClipboardCheck },
  { label: 'Manager', to: '/reports', Icon: BarChart3 },
  { label: 'Housekeeping', to: '/housekeeping', Icon: Sparkles },
  { label: 'Admin', to: '/reports', Icon: Settings },
];

export function Header() {
  const { toggleSidebar, toggleTheme, theme, sidebarOpen } = useUIStore();
  const { pathname } = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0 relative z-50">
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <h1 className="text-base font-semibold">
        {PAGE_TITLES[pathname] ?? 'StaySync'}
      </h1>

      <div className="flex-1">
        {pathname === '/' && (
          <div className="hidden lg:flex items-center gap-1.5">
            {DASHBOARD_VIEWS.map(({ label, to, Icon }) => (
              <Link
                key={label}
                to={to}
                className="h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 hover:bg-accent/50 transition-colors ${n.unread ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {n.unread && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                          <p className="text-xs font-semibold truncate">{n.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                      <button
                        onClick={() => dismiss(n.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border">
                <button className="text-xs text-primary hover:underline w-full text-center">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {notifOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
      )}
    </header>
  );
}

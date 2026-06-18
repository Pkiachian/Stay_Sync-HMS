import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, Menu, Moon, Sun, X } from 'lucide-react';
import { useUIStore } from '@/app/store/uiStore';
import { useAuthStore } from '@/app/store/authStore';
import { fetchNotifications, type ApiNotification, type NotificationType } from '@/lib/protectedEndpoints';

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

const TYPE_META: Record<NotificationType, { dot: string; label: string }> = {
  booking:         { dot: 'bg-cyan-300',    label: 'Booking' },
  payment:         { dot: 'bg-emerald-400', label: 'Payment' },
  room_status:     { dot: 'bg-amber-300',   label: 'Housekeeping' },
  service_request: { dot: 'bg-violet-300',  label: 'Concierge' },
};

const READ_KEY_PREFIX = 'staysync:notifications:read:';

function readStateKey(userId: number | string | undefined): string {
  return READ_KEY_PREFIX + String(userId ?? 'guest');
}

function loadReadIds(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(key: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage may be full or disabled — silently degrade.
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'recently';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'recently';
  const diffSec = Math.max(0, (Date.now() - then) / 1000);

  if (diffSec < 60)        return 'just now';
  if (diffSec < 3600)      return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86_400)    return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 86_400 * 7) return `${Math.floor(diffSec / 86_400)} d ago`;
  return new Date(iso).toLocaleDateString();
}

export function Header() {
  const { toggleSidebar, toggleTheme, theme, sidebarOpen } = useUIStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readKey = readStateKey(user?.id);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds(readKey));

  // Re-load read state when the active user changes (login/logout/switch).
  useEffect(() => {
    setReadIds(loadReadIds(readKey));
  }, [readKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNotifications(8);
      const payload = (res.data as { data?: { notifications?: ApiNotification[] } }).data
        ?? (res.data as unknown as { notifications?: ApiNotification[] });
      setNotifications(payload.notifications ?? []);
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 60s so the bell reflects new activity without a page refresh.
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  // Refresh when the dropdown opens, so users see fresh data.
  useEffect(() => {
    if (notifOpen) void refresh();
  }, [notifOpen, refresh]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const markAllRead = () => {
    const next = new Set(readIds);
    for (const n of notifications) next.add(n.id);
    setReadIds(next);
    saveReadIds(readKey, next);
  };

  const markOneRead = (id: string) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    saveReadIds(readKey, next);
  };

  const handleNotifClick = (notification: ApiNotification) => {
    markOneRead(notification.id);
    setNotifOpen(false);
    if (notification.href) navigate(notification.href);
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

      <div className="min-w-0 flex-1" />

      <div className="hidden items-center gap-1 md:flex">
        <Link to="/about" className="rounded-xl px-3 py-2 text-xs font-semibold text-cyan-50/70 transition hover:bg-white/10 hover:text-white">About Us</Link>
        <Link to="/contact" className="rounded-xl px-3 py-2 text-xs font-semibold text-cyan-50/70 transition hover:bg-white/10 hover:text-white">Contact Us</Link>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl text-cyan-50/75 transition hover:bg-white/10 hover:text-white" aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((open) => !open)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-cyan-50/75 transition hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-11 z-50 w-96 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-black/30 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  <p className="text-[10px] text-cyan-50/55">Recent front-desk activity</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-cyan-200 hover:underline"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-cyan-100/55 hover:text-white" aria-label="Close notifications">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[28rem] divide-y divide-white/10 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-6 text-xs text-cyan-100/70">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                  </div>
                ) : error ? (
                  <div className="px-4 py-6 text-xs text-rose-200">
                    {error}{' '}
                    <button onClick={() => void refresh()} className="ml-1 underline hover:text-rose-100">
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-cyan-100/62">No recent activity.</p>
                ) : (
                  notifications.map((notification) => {
                    const isUnread = !readIds.has(notification.id);
                    const meta = TYPE_META[notification.type] ?? TYPE_META.booking;
                    return (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => handleNotifClick(notification)}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/8 ${isUnread ? 'bg-cyan-400/8' : ''}`}
                      >
                        <div className="mt-1 h-2 w-2 shrink-0">
                          {isUnread ? (
                            <span className={`block h-2 w-2 rounded-full ${meta.dot}`} aria-label="Unread" />
                          ) : (
                            <span className="block h-2 w-2 rounded-full bg-white/10" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-xs font-semibold">{notification.title}</p>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-cyan-50/70">{notification.message}</p>
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-cyan-50/45">
                            <span className="rounded-full bg-white/10 px-1.5 py-0.5 uppercase tracking-wide">{meta.label}</span>
                            <span>{relativeTime(notification.created_at)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
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

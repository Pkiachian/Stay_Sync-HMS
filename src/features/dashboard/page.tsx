import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, AlertCircle,
  Sparkles, Bell, CheckCircle, Wrench,
  Info, Plus, UserCheck, UserX, FileText, Calendar,
  Sun, Moon, ChevronDown, X, Menu,
} from 'lucide-react';
import {
  mockStats, mockArrivals, mockNotifications,
} from '@/lib/mockData';
import { HotelSlideshow } from '@/components/common/HotelSlideshow';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuthStore } from '@/app/store/authStore';
import { useDashboardStore } from '@/app/store/dashboardStore';
import { useUIStore } from '@/app/store/uiStore';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function NotifIcon({ type }: { type: string }) {
  if (type === 'warning') return <AlertCircle className="w-4 h-4 text-amber-500" />;
  if (type === 'error')   return <Wrench      className="w-4 h-4 text-red-500"   />;
  if (type === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
  return <Info className="w-4 h-4 text-blue-500" />;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-sm text-gray-500">{format(time, 'HH:mm:ss')}</span>;
}

const ROLE_COLORS: Record<string, string> = {
  admin:        'bg-red-100 text-red-700',
  manager:      'bg-purple-100 text-purple-700',
  receptionist: 'bg-blue-100 text-blue-700',
  housekeeping: 'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dashboardStats = useDashboardStore((state) => state.stats);
  const dashboardError = useDashboardStore((state) => state.error);
  const fetchStats = useDashboardStore((state) => state.fetchStats);
  const unread = notifications.length;

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const liveStats = {
    occupancyRate: dashboardStats?.rooms.occupancy_rate ?? mockStats.occupancyRate,
    totalRooms: dashboardStats?.rooms.total ?? mockStats.totalRooms,
    occupiedRooms: dashboardStats?.rooms.occupied ?? mockStats.occupiedRooms,
    availableRooms: dashboardStats?.rooms.available ?? mockStats.availableRooms,
    checkInsToday: dashboardStats?.today.check_ins ?? mockStats.checkInsToday,
    checkOutsToday: dashboardStats?.today.check_outs ?? mockStats.checkOutsToday,
    revenueToday: dashboardStats?.today.revenue ?? mockStats.revenueToday,
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen relative">

      {/* ── Background Slideshow ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HotelSlideshow interval={4000} showLabel={false} overlay={false} />
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
      </div>

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h1 className="text-base font-bold text-gray-800">Reception Dashboard</h1>
            <p className="text-xs text-gray-400">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className={cn('hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize', ROLE_COLORS[user.role] ?? 'bg-gray-100')}>
                {user.role}
              </span>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.button>

            {/* Notifications bell */}
            <div className="relative">
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
                className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </motion.button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:underline">Clear all</button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 py-8">All caught up!</p>
                        ) : notifications.map((n) => (
                          <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                            <NotifIcon type={n.type} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                              <p className="text-xs text-gray-400 truncate">{n.message}</p>
                              <p className="text-[10px] text-gray-300 mt-0.5">{n.time}</p>
                            </div>
                            <button onClick={() => setNotifications((p) => p.filter((x) => x.id !== n.id))}
                              className="text-gray-300 hover:text-red-400 shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name[0] ?? 'A'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name ?? 'User'}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </motion.button>
              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold mb-2">
                          {user?.name[0]}
                        </div>
                        <p className="font-semibold text-sm">{user?.name}</p>
                        <p className="text-white/70 text-xs capitalize">{user?.role}</p>
                      </div>
                      {[
                        { label: 'Dashboard',    icon: Menu,       path: '/'            },
                        { label: 'Bookings',     icon: FileText,   path: '/bookings'    },
                        { label: 'Housekeeping', icon: Sparkles,   path: '/housekeeping'},
                        { label: 'Reports',      icon: FileText,   path: '/reports'     },
                      ].map(({ label, icon: Icon, path }) => (
                        <button key={label}
                          onClick={() => { navigate(path); setProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                          <Icon className="w-4 h-4 text-gray-400" />
                          {label}
                        </button>
                      ))}
                      <div className="border-t border-gray-100">
                        <button onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="relative z-10 p-5 space-y-6">

        {/* Welcome Banner */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="rounded-2xl bg-white/90 backdrop-blur-md shadow-lg p-6 border border-white/50">
          {dashboardError && (
            <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              {dashboardError}
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {greeting()}, {user?.name?.split(' ')[0] ?? 'Angela'} 👋
              </h2>
              <p className="text-gray-500 text-sm mt-1">Here's what's happening at your hotel today.</p>
              <div className="flex items-center gap-2 mt-2">
                <LiveClock />
                <span className="text-gray-300">·</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize', ROLE_COLORS[user?.role ?? 'receptionist'])}>
                  {user?.role ?? 'Receptionist'}
                </span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl px-6 py-3 border border-blue-100 text-right">
              <p className="text-4xl font-bold text-blue-600">{liveStats.occupancyRate}%</p>
              <p className="text-gray-400 text-sm">Occupancy Rate</p>
              <p className="text-xs text-green-500 font-medium mt-0.5">↑ 12% vs yesterday</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${liveStats.occupancyRate}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>{liveStats.occupiedRooms} occupied</span>
              <span>{liveStats.availableRooms} available of {liveStats.totalRooms}</span>
            </div>
          </div>

          {/* Quick Actions — navigate to pages */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'New Booking',      icon: Plus,       color: 'bg-blue-500   hover:bg-blue-600',   path: '/bookings'     },
                { label: 'Check In Guest',   icon: UserCheck,  color: 'bg-green-500  hover:bg-green-600',  path: '/bookings'     },
                { label: 'Check Out Guest',  icon: UserX,      color: 'bg-orange-500 hover:bg-orange-600', path: '/bookings'     },
                { label: 'Housekeeping',     icon: Sparkles,   color: 'bg-amber-500  hover:bg-amber-600',  path: '/housekeeping' },
                { label: 'Reports',          icon: FileText,   color: 'bg-purple-500 hover:bg-purple-600', path: '/reports'      },
                { label: 'Tape Chart',       icon: Calendar,   color: 'bg-teal-500   hover:bg-teal-600',   path: '/tape-chart'   },
              ].map(({ label, icon: Icon, color, path }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(path)}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors shadow-sm', color)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

       

        
        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-1">

          <motion.div variants={fadeUp} initial="hidden" animate="show"
            className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Alerts</h3>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              {mockNotifications.map((n) => (
                <motion.div key={n.id} whileHover={{ x: 3 }}
                  className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-400 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{n.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       

          <div className="space-y-4">
            <motion.div variants={fadeUp} initial="hidden" animate="show"
              className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Today's Arrivals</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                  {mockArrivals.length} guests
                </span>
              </div>
              <div className="space-y-2">
                {mockArrivals.map((a) => (
                  <motion.div key={a.id} whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 cursor-pointer border border-blue-100"
                    onClick={() => navigate('/bookings')}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {a.guest[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{a.guest}</p>
                      <p className="text-xs text-gray-400">Room {a.room} · {a.nights} nights</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-blue-600">{a.time}</p>
                      <p className="text-[10px] text-gray-400">ETA</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

           
          </div>
        </div>

        {/* Mini Calendar — compact */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Reservations — May 2026</h3>
            </div>
            <button onClick={() => navigate('/bookings')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>

          {/* Compact calendar — max-w to prevent it being too wide */}
          <div className="max-w-sm">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-[11px] font-bold text-gray-400">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => {
                const day        = i + 1;
                const hasBooking = [13,14,15,17,20,21,22,25,27,28].includes(day);
                const isToday    = day === 19;
                const isPast     = day < 19;
                return (
                  <motion.div key={day} whileHover={{ scale: 1.2 }}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer transition-colors mx-auto',
                      isToday    ? 'bg-blue-500 text-white shadow-md' :
                      hasBooking ? 'bg-blue-100 text-blue-700'        :
                      isPast     ? 'text-gray-300'                    :
                                   'hover:bg-gray-100 text-gray-600'
                    )}>
                    {day}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 mt-3">
            {[
              { color: 'bg-blue-500', label: 'Today'        },
              { color: 'bg-blue-100', label: 'Has bookings' },
              { color: 'bg-gray-200', label: 'Past'         },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded-full', color)} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

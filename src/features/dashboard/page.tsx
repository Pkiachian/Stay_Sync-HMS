import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  BedDouble,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Hotel,
  LogIn,
  LogOut,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { mockArrivals, mockNotifications, mockStats } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
};

const quickActions = [
  { label: 'Add Booking', to: '/bookings', icon: Plus, className: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Check In', to: '/bookings', icon: LogIn, className: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Check Out', to: '/bookings', icon: LogOut, className: 'bg-rose-600 hover:bg-rose-700' },
  { label: 'Assign Room', to: '/tape-chart', icon: BedDouble, className: 'bg-violet-600 hover:bg-violet-700' },
  { label: 'Invoice', to: '/reports', icon: FileText, className: 'bg-slate-700 hover:bg-slate-800' },
];

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('en-KE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      variants={fadeUp}
      className={cn('rounded-2xl border border-white/14 bg-white/92 p-5 text-slate-900 shadow-xl shadow-slate-950/10 backdrop-blur-xl', className)}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {icon && <div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div>}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -3 }} className={cn('rounded-2xl p-4 text-white shadow-xl shadow-slate-950/15', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="rounded-xl bg-white/18 p-2">{icon}</div>
        <TrendingUp className="h-4 w-4 text-white/70" />
      </div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="mt-1 text-sm text-white/86">{label}</p>
      <p className="mt-2 text-xs text-white/70">{sub}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative z-10 min-h-screen space-y-5 p-5 lg:p-6"
    >
      <motion.section
        variants={fadeUp}
        className="rounded-3xl border border-white/16 bg-slate-950/64 p-5 text-white shadow-2xl shadow-black/20 backdrop-blur-2xl"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-cyan-400/14 p-3 text-cyan-100 ring-1 ring-cyan-300/20">
              <Hotel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-cyan-50/68">StaySync Hotel Management</p>
              <h2 className="mt-1 text-2xl font-bold">{greetingFor(now)}, {user?.name?.split(' ')[0] ?? 'Angela'}</h2>
              <p className="mt-1 text-sm text-cyan-50/70">Reception Dashboard - {formatDateTime(now)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
              <input
                placeholder="Search guest, room, booking..."
                className="h-10 w-full rounded-2xl border border-white/15 bg-white/12 pl-9 pr-3 text-sm text-white placeholder:text-white/50 outline-none transition focus:border-cyan-200/50"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/12 px-3 py-2">
              <UserCheck className="h-4 w-4 text-emerald-300" />
              <div>
                <p className="text-xs text-white/60">Logged in as</p>
                <p className="text-sm font-semibold capitalize">{user?.role ?? 'receptionist'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.div variants={stagger} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Rooms Occupied" value={mockStats.occupiedRooms} sub={`${mockStats.occupancyRate}% occupancy`} icon={<BedDouble className="h-5 w-5" />} className="bg-gradient-to-br from-blue-600 to-indigo-700" />
        <KpiCard label="Available Rooms" value={mockStats.availableRooms} sub="Ready for booking" icon={<CheckCircle2 className="h-5 w-5" />} className="bg-gradient-to-br from-emerald-500 to-teal-700" />
        <KpiCard label="Check-ins Today" value={mockStats.checkInsToday} sub="Guests arriving" icon={<LogIn className="h-5 w-5" />} className="bg-gradient-to-br from-cyan-500 to-blue-700" />
        <KpiCard label="Check-outs Today" value={mockStats.checkOutsToday} sub="Guests leaving" icon={<LogOut className="h-5 w-5" />} className="bg-gradient-to-br from-rose-500 to-red-700" />
        <KpiCard label="Revenue Today" value={`KES ${mockStats.revenueToday.toLocaleString()}`} sub="Front desk sales" icon={<Banknote className="h-5 w-5" />} className="bg-gradient-to-br from-amber-500 to-orange-700" />
        <KpiCard label="Pending Payments" value={mockStats.pendingPayments} sub="Unpaid bills" icon={<CreditCard className="h-5 w-5" />} className="bg-gradient-to-br from-slate-600 to-slate-900" />
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2">
          <SectionTitle title="Operational Shortcuts" subtitle="Open dedicated pages for detailed work" icon={<CalendarDays className="h-4 w-4" />} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link to="/bookings" className="rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <LogIn className="mb-3 h-5 w-5 text-blue-600" />
              <p className="font-semibold text-slate-900">Bookings</p>
              <p className="mt-1 text-xs text-slate-500">Reservations, check-ins, check-outs, analytics, and recent bookings.</p>
            </Link>
            <Link to="/housekeeping" className="rounded-2xl border border-amber-100 bg-amber-50 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <Sparkles className="mb-3 h-5 w-5 text-amber-600" />
              <p className="font-semibold text-slate-900">Housekeeping</p>
              <p className="mt-1 text-xs text-slate-500">Cleaning queues, room readiness, staff assignment, and maintenance.</p>
            </Link>
            <Link to="/tape-chart" className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <BedDouble className="mb-3 h-5 w-5 text-emerald-600" />
              <p className="font-semibold text-slate-900">Tape Chart</p>
              <p className="mt-1 text-xs text-slate-500">Room occupancy timeline and availability planning.</p>
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {quickActions.map(({ label, to, icon: Icon, className }) => (
                <Link key={label} to={to} className={cn('flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-white transition', className)}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionTitle title="Notifications" subtitle="Front desk alerts" icon={<Bell className="h-4 w-4" />} />
          <div className="space-y-3">
            {mockNotifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <AlertCircle className={cn('mt-0.5 h-4 w-4 shrink-0', notification.type === 'error' && 'text-red-500', notification.type === 'warning' && 'text-amber-500', notification.type === 'success' && 'text-emerald-500', notification.type === 'info' && 'text-blue-500')} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                  <p className="truncate text-xs text-slate-500">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard>
          <SectionTitle title="Reservation Calendar" subtitle="Upcoming busy dates" icon={<CalendarDays className="h-4 w-4" />} />
          <div className="space-y-3">
            {[
              { day: '20', label: 'High occupancy', value: '88%' },
              { day: '21', label: 'Group arrival', value: '18 rooms' },
              { day: '22', label: 'Peak checkout', value: '24 guests' },
            ].map((item) => (
              <div key={item.day} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">{item.day}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">May 2026</p>
                </div>
                <span className="text-xs font-semibold text-blue-700">{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard className="xl:col-span-2">
          <SectionTitle title="Today's Arrivals" subtitle="Guests expected at the property" icon={<LogIn className="h-4 w-4" />} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {mockArrivals.map((arrival) => (
              <div key={arrival.id} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-slate-800">{arrival.guest}</p>
                <p className="mt-1 text-xs text-slate-500">Room {arrival.room} - {arrival.nights} night{arrival.nights > 1 ? 's' : ''}</p>
                <p className="mt-3 text-sm font-bold text-blue-700">{arrival.time} ETA</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </motion.div>
  );
}

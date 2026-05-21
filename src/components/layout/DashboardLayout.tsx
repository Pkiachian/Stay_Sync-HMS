import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import {
   AlertCircle,
  Sparkles,  Bell, CheckCircle, Wrench,
  Info, Plus, UserCheck, UserX, FileText, Calendar,
} from 'lucide-react';
import {
  mockStats,
   mockRecentBookings, mockArrivals,
  mockNotifications, mockRoomGrid,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';

// ─── Animation ────────────────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };


// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  confirmed:   'bg-blue-100 text-blue-700',
  checked_in:  'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-500',
  cancelled:   'bg-red-100 text-red-600',
  pending:     'bg-yellow-100 text-yellow-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[status] ?? 'bg-gray-100')}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Room status colors ───────────────────────────────────────────────────────
const ROOM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  occupied:    { bg: '#3b82f6', text: '#fff', label: 'Occupied'    },
  available:   { bg: '#22c55e', text: '#fff', label: 'Available'   },
  cleaning:    { bg: '#f59e0b', text: '#fff', label: 'Cleaning'    },
  maintenance: { bg: '#ef4444', text: '#fff', label: 'Maintenance' },
  dirty:       { bg: '#f97316', text: '#fff', label: 'Dirty'       },
};

// ─── Notification icon ────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  if (type === 'warning') return <AlertCircle className="w-4 h-4 text-amber-500" />;
  if (type === 'error')   return <Wrench      className="w-4 h-4 text-red-500"   />;
  if (type === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
  return <Info className="w-4 h-4 text-blue-500" />;
}


// ─── Live clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-white/80 text-sm font-mono">
      {format(time, 'HH:mm:ss')}
    </span>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
     <div className="flex min-h-screen bg-gray-100">
       <div className="w-64 flex-shrink-0">
         <Sidebar />
       </div>
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>

    </div>
  );
}

      {/* ── Welcome Banner ── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        className="rounded-2xl bg-white shadow-lg p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Good Morning, Angela 👋
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">Reception Dashboard</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {format(new Date(), 'EEEE, dd MMMM yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <div className="text-right bg-blue-50 rounded-xl px-4 py-2">
              <p className="text-3xl font-bold text-blue-600">{mockStats.occupancyRate}%</p>
              <p className="text-gray-400 text-xs">Occupancy Rate</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${mockStats.occupancyRate}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{mockStats.occupiedRooms} occupied</span>
            <span>{mockStats.availableRooms} available of {mockStats.totalRooms}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { label: 'Add Booking',     icon: Plus,      color: 'bg-blue-500'   },
            { label: 'Check In Guest',  icon: UserCheck, color: 'bg-green-500'  },
            { label: 'Check Out Guest', icon: UserX,     color: 'bg-orange-500' },
            { label: 'Generate Invoice',icon: FileText,  color: 'bg-purple-500' },
          ].map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-medium hover:opacity-90 transition-opacity', color)}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

     

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       

       
       
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent bookings table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Recent Bookings</h3>
            <button className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2">Guest</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2">Room</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2">Check-in</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2">Check-out</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockRecentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-800">{b.guest}</td>
                    <td className="py-2.5 text-gray-500">{b.room}</td>
                    <td className="py-2.5 text-gray-500">{b.checkIn}</td>
                    <td className="py-2.5 text-gray-500">{b.checkOut}</td>
                    <td className="py-2.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <Bell className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            {mockNotifications.map((n) => (
              <div key={n.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="mt-0.5 shrink-0"><NotifIcon type={n.type} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-400 truncate">{n.message}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Room status grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Room Status Grid</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(ROOM_COLORS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: val.bg }} />
                  <span className="text-[10px] text-gray-400">{val.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
            {mockRoomGrid.map((room) => {
              const color = ROOM_COLORS[room.status] ?? ROOM_COLORS['available'];
              return (
                <motion.div
                  key={room.number}
                  whileHover={{ scale: 1.1 }}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm"
                  style={{ background: color.bg }}
                  title={`Room ${room.number} — ${color.label}`}
                >
                  <span className="text-white text-[10px] font-bold">{room.number}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Today's arrivals + housekeeping */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Today's Arrivals</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {mockArrivals.length} guests
              </span>
            </div>
            <div className="space-y-2">
              {mockArrivals.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-blue-50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {a.guest[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{a.guest}</p>
                    <p className="text-[10px] text-gray-400">Room {a.room} · {a.nights} nights</p>
                  </div>
                  <span className="text-xs font-medium text-blue-600">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Housekeeping</h3>
            <div className="space-y-2">
              {[
                { label: 'Cleaned Today',     value: mockStats.cleanedToday,      color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
                { label: 'Waiting Cleaning',  value: mockStats.waitingCleaning,   color: 'text-amber-600', bg: 'bg-amber-50', icon: Sparkles    },
                { label: 'Staff Active',      value: mockStats.activeStaff,       color: 'text-blue-600',  bg: 'bg-blue-50',  icon: UserCheck   },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className={cn('flex items-center justify-between p-2.5 rounded-xl', bg)}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', color)} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  <span className={cn('text-sm font-bold', color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mini Calendar ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-gray-800">Upcoming Reservations</h3>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 pb-1">{d}</div>
          ))}
          {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const hasBooking = [13,14,15,17,20,21,22,25].includes(day);
            const isToday2   = day === 19;
            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.15 }}
                className={cn(
                  'aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-colors',
                  isToday2   ? 'bg-blue-500 text-white'        :
                  hasBooking ? 'bg-blue-100 text-blue-700'     :
                               'hover:bg-gray-100 text-gray-600'
                )}
              >
                {day}
              </motion.div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-blue-500" />
            <span className="text-[10px] text-gray-400">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-blue-100" />
            <span className="text-[10px] text-gray-400">Has bookings</span>
          </div>
        </div>
      </div>

    
  

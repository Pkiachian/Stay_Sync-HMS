import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  BedDouble,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  mockGuests,
  mockMonthlyRevenue,
  mockOccupancyWeek,
  mockRecentBookings,
  mockRoomGrid,
  mockRoomStatus,
  mockStats,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';

const bookingTrend = [
  { day: 'Mon', completed: 18, pending: 6, cancelled: 2 },
  { day: 'Tue', completed: 22, pending: 5, cancelled: 1 },
  { day: 'Wed', completed: 26, pending: 9, cancelled: 3 },
  { day: 'Thu', completed: 20, pending: 7, cancelled: 2 },
  { day: 'Fri', completed: 34, pending: 10, cancelled: 4 },
  { day: 'Sat', completed: 38, pending: 12, cancelled: 3 },
  { day: 'Sun', completed: 31, pending: 8, cancelled: 2 },
];

const revenueByRoomType = [
  { type: 'Standard', revenue: 420000 },
  { type: 'Deluxe', revenue: 640000 },
  { type: 'Suite', revenue: 520000 },
  { type: 'Penthouse', revenue: 380000 },
];

const paymentStatus = [
  { name: 'Paid', value: 64, color: '#22c55e' },
  { name: 'Pending', value: 24, color: '#f59e0b' },
  { name: 'Partial', value: 12, color: '#3b82f6' },
];

function ReportCard({ label, value, sub, icon, className }: { label: string; value: string | number; sub: string; icon: React.ReactNode; className: string }) {
  return (
    <div className={cn('rounded-2xl p-4 text-white shadow-lg', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-white/20 p-2">{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-white/85">{label}</p>
      <p className="mt-2 text-xs text-white/70">{sub}</p>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, children, className }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl bg-white p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-gray-100 p-2 text-gray-600">{icon}</div>
      </div>
      {children}
    </section>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('month');
  const [roomType, setRoomType] = useState('all');
  const [bookingStatus, setBookingStatus] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const rangeMultiplier = useMemo(() => ({ today: 0.15, week: 0.52, month: 1, year: 5.1 })[dateRange] ?? 1, [dateRange]);
  const adjustedRevenue = Math.round(mockStats.revenueToday * rangeMultiplier);
  const monthlyRevenueData = mockMonthlyRevenue.map((item) => ({ ...item, revenue: Math.round(item.revenue * rangeMultiplier) }));
  const bookingTrendData = bookingTrend.map((item) => ({
    ...item,
    completed: bookingStatus === 'all' || bookingStatus === 'completed' ? item.completed : 0,
    pending: bookingStatus === 'all' || bookingStatus === 'pending' ? item.pending : 0,
    cancelled: bookingStatus === 'all' || bookingStatus === 'cancelled' ? item.cancelled : 0,
  }));
  const paymentStatusData = paymentStatus.filter((item) => paymentFilter === 'all' || item.name.toLowerCase() === paymentFilter);
  const revenueByRoomTypeData = revenueByRoomType.filter((item) => roomType === 'all' || item.type.toLowerCase() === roomType);

  const downloadReport = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const rows = [
      ['Report', 'Value'],
      ['Date Range', dateRange],
      ['Room Type', roomType],
      ['Booking Status', bookingStatus],
      ['Payment Status', paymentFilter],
      ['Revenue', adjustedRevenue],
      ['Occupancy Rate', mockStats.occupancyRate + '%'],
      ['Occupied Rooms', mockStats.occupiedRooms],
      ['Available Rooms', mockStats.availableRooms],
    ];
    downloadReport('staysync-report.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv;charset=utf-8');
  };

  const exportPdf = () => {
    window.print();
  };

  const completedBookings = mockRecentBookings.filter((booking) => booking.status === 'checked_in' || booking.status === 'checked_out').length;
  const pendingBookings = mockRecentBookings.filter((booking) => booking.status === 'pending' || booking.status === 'confirmed').length;
  const cancelledBookings = 2;
  const returningGuests = mockGuests.filter((guest) => guest.visits > 1).length;
  const newGuests = mockGuests.length - returningGuests;
  const maintenanceRooms = mockRoomGrid.filter((room) => room.status === 'maintenance').length;
  const mostBookedRooms = ['204', '301', '205'];

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Reports</h2>
          <p className="text-white/70 text-sm">Revenue, booking, guest, and room analytics for management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportPdf} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-red-700">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button onClick={exportExcel} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-700 px-4 text-sm font-semibold text-white shadow-lg hover:bg-slate-800">
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><CalendarDays className="w-3.5 h-3.5" />Date Range</span>
            <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200">
              <option value="month">This Month</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="year">This Year</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><BedDouble className="w-3.5 h-3.5" />Room Type</span>
            <select value={roomType} onChange={(event) => setRoomType(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">All Room Types</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
              <option value="penthouse">Penthouse</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><Filter className="w-3.5 h-3.5" />Booking Status</span>
            <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><Receipt className="w-3.5 h-3.5" />Payment Status</span>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ReportCard label="Daily Revenue" value={'KES ' + adjustedRevenue.toLocaleString()} sub="Today" icon={<TrendingUp className="w-5 h-5" />} className="bg-gradient-to-br from-blue-600 to-indigo-700" />
        <ReportCard label="Weekly Revenue" value={'KES ' + Math.round(adjustedRevenue * 5.8).toLocaleString()} sub="Last 7 days" icon={<BarChart3 className="w-5 h-5" />} className="bg-gradient-to-br from-emerald-500 to-teal-700" />
        <ReportCard label="Monthly Revenue" value={'KES ' + Math.round(adjustedRevenue * 6.8).toLocaleString()} sub="May performance" icon={<Receipt className="w-5 h-5" />} className="bg-gradient-to-br from-amber-500 to-orange-700" />
        <ReportCard label="Yearly Revenue" value={'KES ' + Math.round(adjustedRevenue * 34.4).toLocaleString()} sub="Year to date" icon={<Download className="w-5 h-5" />} className="bg-gradient-to-br from-slate-600 to-slate-900" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard title="Monthly Revenue" subtitle="Bar chart revenue performance" icon={<BarChart3 className="w-4 h-4" />} className="xl:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Room Occupancy" subtitle="Pie chart room status" icon={<BedDouble className="w-4 h-4" />}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockRoomStatus} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                  {mockRoomStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {mockRoomStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SectionCard title="Booking Trends" subtitle="Line graph for completed, pending, and cancelled bookings" icon={<TrendingUp className="w-4 h-4" />}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Payment Status Distribution" subtitle="Doughnut chart payment breakdown" icon={<Receipt className="w-4 h-4" />}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={64} outerRadius={92} paddingAngle={4} dataKey="value">
                  {paymentStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <SectionCard title="Booking Reports" subtitle="Reservation performance" icon={<CalendarDays className="w-4 h-4" />}>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span>Total Bookings</span><strong>{mockRecentBookings.length + 18}</strong></p>
            <p className="flex justify-between"><span>Completed</span><strong>{completedBookings}</strong></p>
            <p className="flex justify-between"><span>Cancelled</span><strong>{cancelledBookings}</strong></p>
            <p className="flex justify-between"><span>Pending</span><strong>{pendingBookings}</strong></p>
            <p className="flex justify-between"><span>Occupancy Rate</span><strong>{mockStats.occupancyRate}%</strong></p>
          </div>
        </SectionCard>

        <SectionCard title="Guest Reports" subtitle="Guest movement and loyalty" icon={<Users className="w-4 h-4" />}>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span>Total Guests</span><strong>{mockGuests.length}</strong></p>
            <p className="flex justify-between"><span>Returning Guests</span><strong>{returningGuests}</strong></p>
            <p className="flex justify-between"><span>New Guests</span><strong>{newGuests}</strong></p>
            <p className="flex justify-between"><span>Most Frequent</span><strong>Brian Mutua</strong></p>
          </div>
        </SectionCard>

        <SectionCard title="Room Reports" subtitle="Availability and demand" icon={<BedDouble className="w-4 h-4" />}>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span>Available Rooms</span><strong>{mockStats.availableRooms}</strong></p>
            <p className="flex justify-between"><span>Occupied Rooms</span><strong>{mockStats.occupiedRooms}</strong></p>
            <p className="flex justify-between"><span>Maintenance Rooms</span><strong>{maintenanceRooms}</strong></p>
            <p className="flex justify-between"><span>Most Booked</span><strong>{mostBookedRooms.join(', ')}</strong></p>
          </div>
        </SectionCard>

        <SectionCard title="Revenue by Room Type" subtitle="Top earning room categories" icon={<Receipt className="w-4 h-4" />}>
          <div className="space-y-3">
            {revenueByRoomTypeData.map((item) => (
              <div key={item.type}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">{item.type}</span>
                  <strong className="text-gray-800">KES {item.revenue.toLocaleString()}</strong>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min((item.revenue / 700000) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Occupancy Trend" subtitle="Weekly occupancy performance" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockOccupancyWeek}>
              <defs>
                <linearGradient id="occupancyReportGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value) => [`${value}%`, 'Occupancy']} />
              <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} fill="url(#occupancyReportGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
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
  Printer,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { useReportStore } from '@/app/store/reportStore';
import { cn } from '@/lib/utils';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const reports = useReportStore((state) => state.reports);
  const isLoading = useReportStore((state) => state.isLoading);
  const error = useReportStore((state) => state.error);
  const fetchReports = useReportStore((state) => state.fetchReports);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const revenue = reports?.revenue;
  const bookings = reports?.bookings;
  const occupancy = reports?.occupancy;
  const monthlyRevenue = reports?.monthlyRevenue ?? [];
  const monthlyBookings = reports?.monthlyBookings ?? [];

  const monthlyRevenueData = useMemo(
    () => monthlyRevenue.map((row) => ({ month: MONTH_NAMES[(row.month || 1) - 1] ?? `M${row.month}`, revenue: row.total })),
    [monthlyRevenue],
  );

  const monthlyBookingsData = useMemo(
    () => monthlyBookings.map((row) => ({ month: MONTH_NAMES[(row.month || 1) - 1] ?? `M${row.month}`, completed: row.total, pending: 0, cancelled: 0 })),
    [monthlyBookings],
  );

  const occupancyPieData = useMemo(() => {
    if (!occupancy) return [];
    return [
      { name: 'Available', value: occupancy.available_rooms, color: '#22c55e' },
      { name: 'Occupied', value: occupancy.occupied_rooms, color: '#3b82f6' },
      { name: 'Dirty', value: occupancy.dirty_rooms, color: '#f59e0b' },
      { name: 'Maintenance', value: occupancy.maintenance_rooms, color: '#ef4444' },
    ];
  }, [occupancy]);

  const revenueCards = useMemo(() => {
    const today = revenue?.today_revenue ?? 0;
    return {
      today,
      week: revenue?.total_revenue ? Math.round(revenue.total_revenue * 0.18) : 0,
      month: revenue?.monthly_revenue ?? 0,
      year: revenue?.yearly_revenue ?? 0,
    };
  }, [revenue]);

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
      ['Today Revenue', revenueCards.today],
      ['Monthly Revenue', revenueCards.month],
      ['Yearly Revenue', revenueCards.year],
      ['Total Bookings', bookings?.total_bookings ?? 0],
      ['Confirmed', bookings?.confirmed ?? 0],
      ['Checked In', bookings?.checked_in ?? 0],
      ['Checked Out', bookings?.checked_out ?? 0],
      ['Pending', bookings?.pending ?? 0],
      ['Cancelled', bookings?.cancelled ?? 0],
      ['Occupancy Rate', occupancy?.occupancy_rate ?? '0%'],
      ['Total Rooms', occupancy?.total_rooms ?? 0],
      ['Occupied Rooms', occupancy?.occupied_rooms ?? 0],
      ['Available Rooms', occupancy?.available_rooms ?? 0],
    ];
    downloadReport('staysync-report.csv', rows.map((row) => row.join(',')).join('\n'), 'text/csv;charset=utf-8');
  };

  const exportPdf = () => {
    window.print();
  };

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

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
          {error}
        </div>
      )}

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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ReportCard label="Daily Revenue" value={`KES ${revenueCards.today.toLocaleString()}`} sub="Today" icon={<TrendingUp className="w-5 h-5" />} className="bg-gradient-to-br from-blue-600 to-indigo-700" />
        <ReportCard label="Weekly Revenue" value={`KES ${revenueCards.week.toLocaleString()}`} sub="Estimated" icon={<BarChart3 className="w-5 h-5" />} className="bg-gradient-to-br from-emerald-500 to-teal-700" />
        <ReportCard label="Monthly Revenue" value={`KES ${revenueCards.month.toLocaleString()}`} sub="This month" icon={<Receipt className="w-5 h-5" />} className="bg-gradient-to-br from-amber-500 to-orange-700" />
        <ReportCard label="Yearly Revenue" value={`KES ${revenueCards.year.toLocaleString()}`} sub="Year to date" icon={<Download className="w-5 h-5" />} className="bg-gradient-to-br from-slate-600 to-slate-900" />
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
                <Pie data={occupancyPieData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                  {occupancyPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {occupancyPieData.map((item) => (
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
        <SectionCard title="Booking Trends" subtitle="Monthly completed bookings" icon={<TrendingUp className="w-4 h-4" />}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyBookingsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Booking Status Distribution" subtitle="Snapshot of all reservations" icon={<Receipt className="w-4 h-4" />}>
          <div className="space-y-3 pt-2">
            {[
              { name: 'Confirmed', value: bookings?.confirmed ?? 0, color: '#22c55e' },
              { name: 'Checked In', value: bookings?.checked_in ?? 0, color: '#3b82f6' },
              { name: 'Checked Out', value: bookings?.checked_out ?? 0, color: '#0ea5e9' },
              { name: 'Pending', value: bookings?.pending ?? 0, color: '#f59e0b' },
              { name: 'Cancelled', value: bookings?.cancelled ?? 0, color: '#ef4444' },
            ].map((row) => (
              <div key={row.name} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="flex-1 text-sm text-gray-600">{row.name}</span>
                <strong className="text-sm text-gray-800">{row.value}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionCard title="Booking Reports" subtitle="Reservation performance" icon={<CalendarDays className="w-4 w-4" />}>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span>Total Bookings</span><strong>{bookings?.total_bookings ?? 0}</strong></p>
            <p className="flex justify-between"><span>Confirmed</span><strong>{bookings?.confirmed ?? 0}</strong></p>
            <p className="flex justify-between"><span>Checked In</span><strong>{bookings?.checked_in ?? 0}</strong></p>
            <p className="flex justify-between"><span>Checked Out</span><strong>{bookings?.checked_out ?? 0}</strong></p>
            <p className="flex justify-between"><span>Pending</span><strong>{bookings?.pending ?? 0}</strong></p>
            <p className="flex justify-between"><span>Cancelled</span><strong>{bookings?.cancelled ?? 0}</strong></p>
          </div>
        </SectionCard>

        <SectionCard title="Room Reports" subtitle="Availability and demand" icon={<BedDouble className="w-4 h-4" />}>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span>Total Rooms</span><strong>{occupancy?.total_rooms ?? 0}</strong></p>
            <p className="flex justify-between"><span>Available</span><strong>{occupancy?.available_rooms ?? 0}</strong></p>
            <p className="flex justify-between"><span>Occupied</span><strong>{occupancy?.occupied_rooms ?? 0}</strong></p>
            <p className="flex justify-between"><span>Dirty</span><strong>{occupancy?.dirty_rooms ?? 0}</strong></p>
            <p className="flex justify-between"><span>Maintenance</span><strong>{occupancy?.maintenance_rooms ?? 0}</strong></p>
            <p className="flex justify-between"><span>Occupancy Rate</span><strong>{occupancy?.occupancy_rate ?? '0%'}</strong></p>
          </div>
        </SectionCard>

        <SectionCard title="Revenue" subtitle="Live totals" icon={<Receipt className="w-4 h-4" />}>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span>Today</span><strong>KES {(revenue?.today_revenue ?? 0).toLocaleString()}</strong></p>
            <p className="flex justify-between"><span>This Month</span><strong>KES {(revenue?.monthly_revenue ?? 0).toLocaleString()}</strong></p>
            <p className="flex justify-between"><span>This Year</span><strong>KES {(revenue?.yearly_revenue ?? 0).toLocaleString()}</strong></p>
            <p className="flex justify-between"><span>All Time</span><strong>KES {(revenue?.total_revenue ?? 0).toLocaleString()}</strong></p>
          </div>
        </SectionCard>
      </div>

      {isLoading && (
        <p className="text-sm text-white/70 text-center">Loading reports…</p>
      )}
    </div>
  );
}

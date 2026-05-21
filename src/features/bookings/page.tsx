import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Eye, Edit, X, Printer,
  Mail, Calendar, User, BedDouble, DollarSign,
  CheckCircle, XCircle, Clock, Phone, CreditCard,
  Hash, Users, Baby, FileText, ChevronDown,UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  guestName: string;
  phone: string;
  email: string;
  idNumber: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  roomType: string;
  roomNumber: string;
  roomPrice: number;
  totalAmount: number;
  deposit: number;
  taxes: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  specialRequests: string;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_BOOKINGS: Booking[] = [
  { id: 'SS-001', guestName: 'James Odhiambo', phone: '+254712345678', email: 'james@email.com',  idNumber: 'KE123456', checkIn: '2026-05-13', checkOut: '2026-05-18', adults: 2, children: 0, roomType: 'Suite',         roomNumber: '301', roomPrice: 15000, totalAmount: 75000, deposit: 25000, taxes: 6750,  paymentMethod: 'Mpesa',       paymentStatus: 'paid',    bookingStatus: 'checked_in',  specialRequests: 'High floor preferred',     createdAt: '2026-05-10' },
  { id: 'SS-002', guestName: 'Amina Hassan',   phone: '+254723456789', email: 'amina@email.com',  idNumber: 'SO789012', checkIn: '2026-05-19', checkOut: '2026-05-23', adults: 2, children: 1, roomType: 'Deluxe Twin',   roomNumber: '205', roomPrice: 12000, totalAmount: 48000, deposit: 16000, taxes: 4320,  paymentMethod: 'Card',        paymentStatus: 'partial', bookingStatus: 'confirmed',   specialRequests: 'Baby cot needed',          createdAt: '2026-05-12' },
  { id: 'SS-003', guestName: 'Brian Mutua',    phone: '+254734567890', email: 'brian@email.com',  idNumber: 'KE234567', checkIn: '2026-05-14', checkOut: '2026-05-16', adults: 1, children: 0, roomType: 'Deluxe King',   roomNumber: '201', roomPrice: 12000, totalAmount: 24000, deposit: 24000, taxes: 2160,  paymentMethod: 'Cash',        paymentStatus: 'paid',    bookingStatus: 'checked_in',  specialRequests: '',                          createdAt: '2026-05-13' },
  { id: 'SS-004', guestName: 'Grace Wanjiru',  phone: '+254745678901', email: 'grace@email.com',  idNumber: 'KE345678', checkIn: '2026-05-13', checkOut: '2026-05-18', adults: 2, children: 2, roomType: 'Suite',         roomNumber: '302', roomPrice: 15000, totalAmount: 75000, deposit: 30000, taxes: 6750,  paymentMethod: 'Bank Transfer',paymentStatus: 'paid',    bookingStatus: 'checked_in',  specialRequests: 'Extra beds for children',  createdAt: '2026-05-11' },
  { id: 'SS-005', guestName: 'Peter Otieno',   phone: '+254756789012', email: 'peter@email.com',  idNumber: 'KE456789', checkIn: '2026-05-17', checkOut: '2026-05-19', adults: 1, children: 0, roomType: 'Standard King', roomNumber: '110', roomPrice: 8000,  totalAmount: 16000, deposit: 16000, taxes: 1440,  paymentMethod: 'Mpesa',       paymentStatus: 'paid',    bookingStatus: 'checked_out', specialRequests: '',                          createdAt: '2026-05-15' },
  { id: 'SS-006', guestName: 'Fatuma Ali',     phone: '+254767890123', email: 'fatuma@email.com', idNumber: 'TZ567890', checkIn: '2026-05-20', checkOut: '2026-05-22', adults: 2, children: 0, roomType: 'Deluxe Twin',   roomNumber: '203', roomPrice: 12000, totalAmount: 24000, deposit: 0,     taxes: 2160,  paymentMethod: 'Card',        paymentStatus: 'unpaid',  bookingStatus: 'pending',     specialRequests: 'Late check-in after 10pm', createdAt: '2026-05-16' },
  { id: 'SS-007', guestName: 'David Kimani',   phone: '+254778901234', email: 'david@email.com',  idNumber: 'KE678901', checkIn: '2026-05-21', checkOut: '2026-05-25', adults: 2, children: 0, roomType: 'Penthouse',     roomNumber: '401', roomPrice: 30000, totalAmount: 120000,deposit: 60000, taxes: 10800, paymentMethod: 'Bank Transfer',paymentStatus: 'partial', bookingStatus: 'confirmed',   specialRequests: 'Airport pickup needed',    createdAt: '2026-05-14' },
  { id: 'SS-008', guestName: 'Sandra Achieng', phone: '+254789012345', email: 'sandra@email.com', idNumber: 'KE789012', checkIn: '2026-05-19', checkOut: '2026-05-22', adults: 1, children: 0, roomType: 'Deluxe King',   roomNumber: '202', roomPrice: 12000, totalAmount: 36000, deposit: 0,     taxes: 3240,  paymentMethod: 'Mpesa',       paymentStatus: 'unpaid',  bookingStatus: 'cancelled',   specialRequests: '',                          createdAt: '2026-05-13' },
];

const ROOM_TYPES = ['Standard King', 'Deluxe King', 'Deluxe Twin', 'Suite', 'Penthouse'];
const AVAILABLE_ROOMS: Record<string, string[]> = {
  'Standard King': ['101','102','103','104','105','106','107','108'],
  'Deluxe King':   ['201','202','204','206'],
  'Deluxe Twin':   ['203','205'],
  'Suite':         ['301','302','303'],
  'Penthouse':     ['401','402'],
};
const ROOM_PRICES: Record<string, number> = {
  'Standard King': 8000,
  'Deluxe King':   12000,
  'Deluxe Twin':   12000,
  'Suite':         15000,
  'Penthouse':     30000,
};
const PAYMENT_METHODS = ['Mpesa','Card','Cash','Bank Transfer'];
const BOOKING_STATUSES = ['pending','confirmed','checked_in','checked_out','cancelled','no_show'];

const STATUS_STYLES: Record<string, string> = {
  confirmed:   'bg-blue-100 text-blue-700',
  checked_in:  'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-500',
  cancelled:   'bg-red-100 text-red-600',
  pending:     'bg-yellow-100 text-yellow-700',
  no_show:     'bg-orange-100 text-orange-600',
};

const PAYMENT_STYLES: Record<string, string> = {
  paid:    'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid:  'bg-red-100 text-red-600',
};

// ─── Empty form state ─────────────────────────────────────────────────────────
const emptyForm = {
  guestName: '', phone: '', email: '', idNumber: '',
  checkIn: '', checkOut: '', adults: 1, children: 0,
  roomType: 'Standard King', roomNumber: '', roomPrice: 8000,
  deposit: 0, paymentMethod: 'Mpesa', paymentStatus: 'unpaid',
  bookingStatus: 'pending', specialRequests: '',
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function calcNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings, setBookings]         = useState<Booking[]>(INITIAL_BOOKINGS);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [showForm, setShowForm]         = useState(false);
  const [viewBooking, setViewBooking]   = useState<Booking | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [formError, setFormError]       = useState('');

  // Derived values
  const nights      = calcNights(form.checkIn, form.checkOut);
  const subtotal    = form.roomPrice * nights;
  const taxes       = Math.round(subtotal * 0.09);
  const totalAmount = subtotal + taxes;

  // Dynamic pricing
  const getDynamicPrice = (type: string, checkIn: string) => {
    let base = ROOM_PRICES[type] ?? 8000;
    if (checkIn) {
      const day = new Date(checkIn).getDay();
      if (day === 5 || day === 6) base = Math.round(base * 1.2); // Weekend +20%
    }
    return base;
  };

  // Check for booking conflicts
  const hasConflict = (roomNumber: string, checkIn: string, checkOut: string, excludeId?: string) => {
    return bookings.some((b) => {
      if (excludeId && b.id === excludeId) return false;
      if (b.roomNumber !== roomNumber) return false;
      if (b.bookingStatus === 'cancelled') return false;
      const bIn  = new Date(b.checkIn).getTime();
      const bOut = new Date(b.checkOut).getTime();
      const nIn  = new Date(checkIn).getTime();
      const nOut = new Date(checkOut).getTime();
      return nIn < bOut && nOut > bIn;
    });
  };

  const handleFormChange = (field: string, value: string | number) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'roomType') {
        const price = getDynamicPrice(String(value), prev.checkIn);
        updated.roomPrice = price;
        updated.roomNumber = '';
      }
      if (field === 'checkIn') {
        const price = getDynamicPrice(prev.roomType, String(value));
        updated.roomPrice = price;
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!form.guestName || !form.checkIn || !form.checkOut || !form.roomNumber) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setFormError('Check-out must be after check-in.');
      return;
    }
    if (hasConflict(form.roomNumber, form.checkIn, form.checkOut)) {
      setFormError(`Room ${form.roomNumber} is already booked for these dates!`);
      return;
    }
    const newBooking: Booking = {
      ...form,
      id: `SS-${String(bookings.length + 1).padStart(3, '0')}`,
      totalAmount,
      taxes,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings((prev) => [newBooking, ...prev]);
    setForm(emptyForm);
    setShowForm(false);
    setFormError('');
  };

  // Filters
  const filtered = bookings.filter((b) => {
    const matchSearch = b.guestName.toLowerCase().includes(search.toLowerCase()) ||
                        b.id.toLowerCase().includes(search.toLowerCase()) ||
                        b.roomNumber.includes(search);
    const matchStatus = statusFilter === 'all' || b.bookingStatus === statusFilter;
    const matchType   = typeFilter === 'all' || b.roomType === typeFilter;
    const matchDate   = !dateFilter || b.checkIn === dateFilter || b.checkOut === dateFilter;
    return matchSearch && matchStatus && matchType && matchDate;
  });

  return (
    <div className="p-5 space-y-5 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Bookings</h2>
          <p className="text-white/70 text-sm">{bookings.length} total reservations</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); setFormError(''); }}
          className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors shadow"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Bookings',  value: bookings.length,                                          color: 'from-blue-500 to-blue-700',     icon: Calendar    },
          { label: 'Checked In',      value: bookings.filter(b => b.bookingStatus==='checked_in').length,  color: 'from-green-400 to-green-600',   icon: CheckCircle },
          { label: 'Pending',         value: bookings.filter(b => b.bookingStatus==='pending').length,     color: 'from-amber-400 to-amber-600',   icon: Clock       },
          { label: 'Total Revenue',   value: `KES ${(bookings.filter(b=>b.paymentStatus==='paid').reduce((s,b)=>s+b.totalAmount,0)/1000).toFixed(0)}k`, color: 'from-violet-500 to-violet-700', icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={cn('rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br overflow-hidden relative', color)}>
            <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />
            <Icon className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-white/80 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guest name, booking ID, room..."
              className="w-full pl-9 pr-3 h-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 appearance-none"
            >
              <option value="all">All Room Types</option>
              {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {['all', ...BOOKING_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors',
                statusFilter === s ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Booking ID','Guest','Room','Check-in','Check-out','Amount','Payment','Status','Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <motion.tr
                  key={b.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{b.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {b.guestName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 whitespace-nowrap">{b.guestName}</p>
                        <p className="text-[10px] text-gray-400">{b.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-700">#{b.roomNumber}</p>
                    <p className="text-[10px] text-gray-400">{b.roomType}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{b.checkIn}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{b.checkOut}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800 text-xs whitespace-nowrap">KES {b.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Dep: KES {b.deposit.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', PAYMENT_STYLES[b.paymentStatus])}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap', STATUS_STYLES[b.bookingStatus])}>
                      {b.bookingStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewBooking(b)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors" title="Print Invoice">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors" title="Send Email">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setBookings(prev => prev.map(bk => bk.id === b.id ? { ...bk, bookingStatus: 'cancelled' } : bk))}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors" title="Cancel"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No bookings found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Booking Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 my-4"
            >
              {/* Form header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-white text-lg">New Booking</h3>
                  <p className="text-white/70 text-xs">Fill in all required details</p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Guest Information */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Guest Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Full Name *',        field: 'guestName', placeholder: 'Guest full name',      type: 'text'  },
                      { label: 'Phone Number *',     field: 'phone',     placeholder: '+254...',              type: 'tel'   },
                      { label: 'Email Address',      field: 'email',     placeholder: 'guest@email.com',      type: 'email' },
                      { label: 'ID/Passport Number', field: 'idNumber',  placeholder: 'National ID or passport', type: 'text' },
                    ].map(({ label, field, placeholder, type }) => (
                      <div key={field}>
                        <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={String((form as Record<string, unknown>)[field] ?? '')}
                          onChange={(e) => handleFormChange(field, e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Information */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Booking Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Check-in Date *</label>
                      <input type="date" value={form.checkIn} onChange={(e) => handleFormChange('checkIn', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Check-out Date *</label>
                      <input type="date" value={form.checkOut} onChange={(e) => handleFormChange('checkOut', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Adults</label>
                      <input type="number" min={1} max={10} value={form.adults} onChange={(e) => handleFormChange('adults', Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Children</label>
                      <input type="number" min={0} max={10} value={form.children} onChange={(e) => handleFormChange('children', Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                  </div>
                  {nights > 0 && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-600 font-medium">
                      📅 {nights} night{nights > 1 ? 's' : ''} selected
                      {new Date(form.checkIn).getDay() === 5 || new Date(form.checkIn).getDay() === 6
                        ? ' · 🌟 Weekend rate applied (+20%)'
                        : ''}
                    </div>
                  )}
                </div>

                {/* Room Information */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-blue-500" />
                    Room Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Room Type *</label>
                      <select value={form.roomType} onChange={(e) => handleFormChange('roomType', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Room Number *</label>
                      <select value={form.roomNumber} onChange={(e) => handleFormChange('roomNumber', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">Select room</option>
                        {(AVAILABLE_ROOMS[form.roomType] ?? []).map((r) => {
                          const conflict = hasConflict(r, form.checkIn, form.checkOut);
                          return (
                            <option key={r} value={r} disabled={conflict}>
                              Room {r} {conflict ? '(Booked)' : '(Available)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Room Price per Night</label>
                      <div className="h-9 px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm flex items-center text-gray-600 font-semibold">
                        KES {form.roomPrice.toLocaleString()} / night
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Payment Details
                  </h4>

                  {/* Price breakdown */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Room ({nights} nights × KES {form.roomPrice.toLocaleString()})</span>
                      <span>KES {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Taxes & Service (9%)</span>
                      <span>KES {taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-1.5">
                      <span>Total Amount</span>
                      <span className="text-blue-600">KES {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Deposit Amount (KES)</label>
                      <input type="number" min={0} value={form.deposit} onChange={(e) => handleFormChange('deposit', Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Payment Method</label>
                      <select value={form.paymentMethod} onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Payment Status</label>
                      <select value={form.paymentStatus} onChange={(e) => handleFormChange('paymentStatus', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        {['unpaid','partial','paid'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Booking Status</label>
                      <select value={form.bookingStatus} onChange={(e) => handleFormChange('bookingStatus', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        {BOOKING_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace('_',' ')}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Special Requests</label>
                  <textarea
                    value={form.specialRequests}
                    onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                    placeholder="Any special requirements from the guest..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  />
                </div>
              </div>

              {/* Form actions */}
              <div className="p-5 border-t border-gray-100 flex gap-2 flex-wrap">
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 h-9 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={() => handleFormChange('bookingStatus', 'pending')} className="flex items-center gap-2 px-4 h-9 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200 transition-colors">
                  <FileText className="w-4 h-4" /> Save Draft
                </button>
                <button onClick={handleSubmit} className="flex items-center gap-2 px-4 h-9 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors ml-auto">
                  <CheckCircle className="w-4 h-4" /> Create Booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── View Booking Modal ── */}
      <AnimatePresence>
        {viewBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewBooking(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono opacity-80">{viewBooking.id}</span>
                  <button onClick={() => setViewBooking(null)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-bold">{viewBooking.guestName}</h3>
                <p className="text-white/80 text-sm">{viewBooking.roomType} · Room {viewBooking.roomNumber}</p>
                <div className="flex gap-2 mt-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[viewBooking.bookingStatus])}>
                    {viewBooking.bookingStatus.replace('_',' ')}
                  </span>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', PAYMENT_STYLES[viewBooking.paymentStatus])}>
                    {viewBooking.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Phone',     value: viewBooking.phone,     icon: Phone      },
                    { label: 'Email',     value: viewBooking.email,     icon: Mail       },
                    { label: 'ID Number', value: viewBooking.idNumber,  icon: Hash       },
                    { label: 'Adults',    value: viewBooking.adults,    icon: Users      },
                    { label: 'Children',  value: viewBooking.children,  icon: Baby       },
                    { label: 'Check-in',  value: viewBooking.checkIn,   icon: Calendar   },
                    { label: 'Check-out', value: viewBooking.checkOut,  icon: Calendar   },
                    { label: 'Nights',    value: calcNights(viewBooking.checkIn, viewBooking.checkOut), icon: BedDouble },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                      <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400">{label}</p>
                        <p className="text-xs font-semibold text-gray-700">{String(value)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded-xl p-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Room Price</span>
                    <span>KES {viewBooking.roomPrice.toLocaleString()} / night</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Taxes</span>
                    <span>KES {viewBooking.taxes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Deposit Paid</span>
                    <span>KES {viewBooking.deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 border-t border-blue-100 pt-1">
                    <span>Total</span>
                    <span className="text-blue-600">KES {viewBooking.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {viewBooking.specialRequests && (
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Special Requests</p>
                    <p className="text-xs text-amber-600">{viewBooking.specialRequests}</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button className="flex-1 h-9 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 flex items-center justify-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button className="flex-1 h-9 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 flex items-center justify-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Check In
                </button>
                <button className="flex-1 h-9 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 flex items-center justify-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
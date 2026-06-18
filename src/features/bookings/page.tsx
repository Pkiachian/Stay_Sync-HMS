import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Eye, Edit, X, Printer,
  Mail, Calendar, User, BedDouble, DollarSign,
  CheckCircle, XCircle, Clock, Phone, CreditCard,
  Hash, Users, Baby, FileText, ChevronDown,UserCheck,
  Receipt, Loader2, ShieldCheck,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  type ApiBooking, type ApiRoomType, createBooking, cancelBooking, fetchRoomTypes, fetchRooms, fetchGuests, createGuest,
  type ApiRoom, type ApiGuest,
  verifyMpesaPayment, recordManualPayment, type ApiPayment,
} from '@/lib/protectedEndpoints';
import { useBookingsApiStore } from '@/app/store/bookingsApiStore';
import { useAuthStore } from '@/app/store/authStore';
import { openStaffInvoice } from '@/lib/invoiceApi';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Booking {
  numericId: number;
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

function mapApiBooking(booking: ApiBooking): Booking {
  const guestName = [booking.guest?.first_name, booking.guest?.last_name].filter(Boolean).join(' ') || 'Guest';
  const roomType = booking.room?.room_type ?? booking.room?.roomType;
  const checkIn = String(booking.check_in_date).slice(0, 10);
  const checkOut = String(booking.check_out_date).slice(0, 10);
  // Laravel's RoomType uses `base_price`; fall back to subtotal.
  const roomPrice = Number(roomType?.base_price ?? booking.subtotal ?? 0);
  const totalAmount = Number(booking.total_price ?? 0);
  const taxes = Number(booking.tax_amount ?? 0);

  return {
    numericId: booking.id,
    id: booking.booking_reference,
    guestName,
    phone: booking.guest?.phone ?? '',
    email: booking.guest?.email ?? '',
    idNumber: '',
    checkIn,
    checkOut,
    adults: booking.num_adults ?? 1,
    children: booking.num_children ?? 0,
    roomType: roomType?.name ?? 'Room',
    roomNumber: booking.room?.room_number ?? '',
    roomPrice,
    totalAmount,
    deposit: 0,
    taxes,
    paymentMethod: '',
    paymentStatus: 'unpaid',
    bookingStatus: booking.status,
    specialRequests: booking.special_requests ?? '',
    createdAt: checkIn,
  };
}

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
// Default roomType / roomPrice start blank; the form's `useEffect` below
// fills them in once room types load from the API, so we never pretend
// a "Standard King" exists if the DB doesn't have one.
const emptyForm = {
  guestName: '', phone: '', email: '', idNumber: '',
  checkIn: '', checkOut: '', adults: 1, children: 0,
  roomType: '', roomNumber: '', roomPrice: 0,
  deposit: 0, paymentMethod: 'Mpesa', paymentStatus: 'unpaid',
  bookingStatus: 'pending', specialRequests: '',
};// ─── Helper ───────────────────────────────────────────────────────────────────
function calcNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const apiBookings = useBookingsApiStore((state) => state.bookings);
  const loadError = useBookingsApiStore((state) => state.error);
  const fetchBookings = useBookingsApiStore((state) => state.fetchBookings);
  const isAuthed = useAuthStore((state) => state.isAuthenticated);
  const [rooms, setRooms]               = useState<ApiRoom[]>([]);
  const [roomTypes, setRoomTypes]       = useState<ApiRoomType[]>([]);
  const [search, setSearch]             = useState(() => searchParams.get('q') ?? '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]     = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [showForm, setShowForm]         = useState(false);
  const [viewBooking, setViewBooking]   = useState<Booking | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [formError, setFormError]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm-payment sub-modal state. Sits on top of the view modal.
  type ConfirmTab = 'mpesa' | 'manual';
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [confirmTab, setConfirmTab]     = useState<ConfirmTab>('mpesa');
  const [mpesaCode, setMpesaCode]       = useState('');
  const [mpesaError, setMpesaError]     = useState('');
  const [mpesaVerifying, setMpesaVerifying] = useState(false);
  const [mpesaMatch, setMpesaMatch]     = useState<ApiPayment | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState<'cash' | 'card' | 'bank'>('cash');
  const [manualRef, setManualRef]       = useState('');
  const [manualDate, setManualDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [manualError, setManualError]   = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    setBookings(apiBookings.map(mapApiBooking));
  }, [apiBookings]);

  // Load real rooms and room types so the form can submit room_id +
  // room_type_id to Laravel and so the form options come from the DB.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [roomsRes, typesRes] = await Promise.all([fetchRooms(), fetchRoomTypes()]);
        const roomsPayload = Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data.data;
        const typesPayload = Array.isArray(typesRes.data) ? typesRes.data : typesRes.data.data;
        if (!cancelled) {
          setRooms(roomsPayload ?? []);
          setRoomTypes(typesPayload ?? []);
        }
      } catch {
        if (!cancelled) {
          setRooms([]);
          setRoomTypes([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthed]);

  // Find or create a guest by phone number. The backend requires guest_id on a
  // booking, so this resolves the form's typed-in guest into a real DB row.
  const resolveGuestId = async (name: string, phone: string, email: string): Promise<number> => {
    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const res = await fetchGuests();
      const list: ApiGuest[] = Array.isArray(res.data) ? res.data : res.data.data ?? [];
      const existing = list.find((g) => g.phone === trimmedPhone);
      if (existing) return existing.id;
    }

    const [first, ...rest] = name.trim().split(/\s+/);
    const last = rest.join(' ') || '-';
    const created = await createGuest({
      first_name: first || 'Guest',
      last_name: last,
      phone: phone || null,
      email: email || null,
    });
    const guest = (created.data as { data?: ApiGuest })?.data ?? (created.data as ApiGuest);
    if (!guest?.id) throw new Error('Guest creation returned no id.');
    return guest.id;
  };

  // Derived values
  const nights      = calcNights(form.checkIn, form.checkOut);
  const subtotal    = form.roomPrice * nights;
  const taxes       = Math.round(subtotal * 0.09);
  const totalAmount = subtotal + taxes;

  // Live room-type index: prices come from the API, rooms are bucketed by
  // their room_type_id. The legacy ROOM_PRICES constant is now only a
  // fallback used while the API request is in flight on a cold page.
  const priceByTypeName = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of roomTypes) map[t.name] = Number(t.base_price);
    return map;
  }, [roomTypes]);

  const roomsByTypeName = useMemo(() => {
    const map: Record<string, ApiRoom[]> = {};
    for (const r of rooms) {
      const typeName = r.room_type?.name ?? r.roomType?.name;
      if (!typeName) continue;
      (map[typeName] ??= []).push(r);
    }
    return map;
  }, [rooms]);

  // When the user opens the new-booking form, fill in the first available
  // room type + price so the form is ready to use immediately. We don't
  // pick a default room number — that's user-driven.
  useEffect(() => {
    if (!showForm || form.roomType || roomTypes.length === 0) return;
    const first = roomTypes[0];
    setForm((prev) => ({
      ...prev,
      roomType: first.name,
      roomPrice: Number(first.base_price) || 0,
    }));
  }, [showForm, form.roomType, roomTypes]);

  // Dynamic pricing
  const getDynamicPrice = (type: string, checkIn: string) => {
    let base = priceByTypeName[type] ?? ROOM_PRICES[type] ?? 8000;
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

  const handleSubmit = async () => {
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

    const room = rooms.find((r) => String(r.room_number) === String(form.roomNumber));
    if (!room) {
      setFormError(`Room ${form.roomNumber} is not available in the system.`);
      return;
    }
    const roomTypeId = (room.room_type ?? room.roomType)?.id;
    if (!roomTypeId) {
      setFormError('Selected room has no room type. Please contact an admin.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const guestId = await resolveGuestId(form.guestName, form.phone, form.email);
      await createBooking({
        guest_id: guestId,
        room_id: room.id,
        room_type_id: roomTypeId,
        check_in: form.checkIn,
        check_out: form.checkOut,
        adults: form.adults,
        children: form.children,
        notes: form.specialRequests,
      });

      setForm(emptyForm);
      setShowForm(false);
      await fetchBookings();
    } catch (err) {
      const message = (err as { message?: string; errors?: Record<string, string[]> })?.message
        ?? (err as { errors?: Record<string, string[]> })?.errors
          ? Object.values((err as { errors?: Record<string, string[]> }).errors ?? {}).flat().join(' ')
          : 'Failed to create booking. Please try again.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking ${booking.id} for ${booking.guestName}?`)) return;
    try {
      await cancelBooking(booking.numericId);
      await fetchBookings();
    } catch (err) {
      window.alert('Failed to cancel booking: ' + ((err as { message?: string })?.message ?? 'unknown error'));
    }
  };

  // Filters
  const filtered = bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const matchSearch =
      b.guestName.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.roomNumber.toLowerCase().includes(q) ||
      b.roomType.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q);
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

      {loadError && (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {loadError}
        </div>
      )}

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (searchParams.get('q')) setSearchParams((params) => {
                  const next = new URLSearchParams(params);
                  next.delete('q');
                  return next;
                }, { replace: true });
              }}
              placeholder="Search guest name, booking ID, room, phone, email..."
              aria-label="Search bookings"
              className="w-full pl-9 pr-9 h-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
              {roomTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
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
                      <button onClick={() => openStaffInvoice(b.numericId, 'invoice').catch((e) => window.alert(e.message ?? 'Could not open invoice'))} className="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors" title="Print Invoice">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-100 transition-colors" title="Send Email">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCancel(b)}
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
              <p className="text-sm">
                {search.trim() || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter
                  ? `No bookings match the current filters${search.trim() ? ` (search: “${search.trim()}”)` : ''}.`
                  : 'No bookings found'}
              </p>
              {(search.trim() || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setDateFilter(''); }}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              )}
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
                    <div className="col-span-2">
                      <DateRangePicker
                        checkIn={form.checkIn}
                        checkOut={form.checkOut}
                        onCheckInChange={(v) => handleFormChange('checkIn', v)}
                        onCheckOutChange={(v) => handleFormChange('checkOut', v)}
                        label1="Check-in Date"
                        label2="Check-out Date"
                      />
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
                        {roomTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Room Number *</label>
                      <select value={form.roomNumber} onChange={(e) => handleFormChange('roomNumber', e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">Select room</option>
                        {(roomsByTypeName[form.roomType] ?? []).map((r) => {
                          const conflict = hasConflict(String(r.room_number), form.checkIn, form.checkOut);
                          return (
                            <option key={r.id} value={String(r.room_number)} disabled={conflict}>
                              Room {r.room_number} {conflict ? '(Booked)' : '(Available)'}
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
                <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-4 h-9 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors ml-auto disabled:opacity-60 disabled:cursor-not-allowed">
                  <CheckCircle className="w-4 h-4" /> {isSubmitting ? 'Creating…' : 'Create Booking'}
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

              <div className="p-4 border-t border-gray-100 flex flex-wrap gap-2">
                <button className="flex-1 h-9 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 flex items-center justify-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button className="flex-1 h-9 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 flex items-center justify-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Check In
                </button>
                {viewBooking.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => {
                      setMpesaCode('');
                      setMpesaError('');
                      setMpesaMatch(null);
                      setManualAmount(String(viewBooking.totalAmount - viewBooking.deposit));
                      setManualError('');
                      setConfirmOpen(true);
                    }}
                    className="flex-1 h-9 bg-amber-500 text-white rounded-xl text-xs font-medium hover:bg-amber-600 flex items-center justify-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Confirm Payment
                  </button>
                )}
                <button onClick={() => openStaffInvoice(viewBooking.numericId, viewBooking.paymentStatus === 'paid' ? 'receipt' : 'invoice').catch((e) => window.alert(e.message ?? 'Could not open invoice'))} className="flex-1 h-9 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 flex items-center justify-center gap-1">
                  <Printer className="w-3.5 h-3.5" /> {viewBooking.paymentStatus === 'paid' ? 'Receipt' : 'Invoice'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Payment Modal ── */}
      <AnimatePresence>
        {confirmOpen && viewBooking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono opacity-80">{viewBooking.id}</span>
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold">Confirm payment</h3>
                <p className="text-white/80 text-xs">
                  Outstanding: KES {(viewBooking.totalAmount - viewBooking.deposit).toLocaleString()} ·{' '}
                  Guest: {viewBooking.guestName}
                </p>
              </div>

              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setConfirmTab('mpesa')}
                  className={cn(
                    'flex-1 h-10 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5',
                    confirmTab === 'mpesa'
                      ? 'text-cyan-700 border-b-2 border-cyan-500 bg-cyan-50/50'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Verify M-Pesa
                </button>
                <button
                  onClick={() => setConfirmTab('manual')}
                  className={cn(
                    'flex-1 h-10 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5',
                    confirmTab === 'manual'
                      ? 'text-cyan-700 border-b-2 border-cyan-500 bg-cyan-50/50'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  <Receipt className="w-3.5 h-3.5" /> Record Cash / Card
                </button>
              </div>

              <div className="p-5 space-y-3">
                {confirmTab === 'mpesa' && (
                  <>
                    <p className="text-xs text-gray-600">
                      Ask the guest for the M-Pesa SMS code (e.g. <span className="font-mono">TGJ...</span> or a
                      CheckoutRequestID). We'll confirm the code matches a completed payment on file.
                    </p>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-600">M-Pesa code</span>
                      <input
                        type="text"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value.trim())}
                        placeholder="TGJ7XXXXXX or ws_CO_..."
                        className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                        autoComplete="off"
                      />
                    </label>

                    {mpesaError && (
                      <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                        {mpesaError}
                      </p>
                    )}

                    {mpesaMatch && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1">
                        <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Payment verified
                        </p>
                        <p className="text-emerald-900/80">
                          <span className="font-semibold">Amount:</span> KES {Number(mpesaMatch.amount).toLocaleString()}{' '}
                          · <span className="font-semibold">Booking:</span> {mpesaMatch.booking?.booking_reference ?? viewBooking.id}
                        </p>
                        <p className="text-emerald-900/80">
                          <span className="font-semibold">Receipt:</span> <span className="font-mono">{mpesaMatch.transaction_reference}</span>
                        </p>
                        <p className="text-emerald-900/80">
                          <span className="font-semibold">Paid at:</span> {mpesaMatch.paid_at ? new Date(mpesaMatch.paid_at).toLocaleString() : '—'}
                        </p>
                        {mpesaMatch.booking_id !== viewBooking.numericId && (
                          <p className="rounded-md bg-amber-100 px-2 py-1 text-amber-900">
                            Heads up: this code is on booking {mpesaMatch.booking?.booking_reference}, not {viewBooking.id}.
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (!mpesaCode) {
                          setMpesaError('Enter the M-Pesa code first.');
                          return;
                        }
                        setMpesaVerifying(true);
                        setMpesaError('');
                        setMpesaMatch(null);
                        verifyMpesaPayment(mpesaCode)
                          .then((res) => setMpesaMatch(res.data.data.payment))
                          .catch((err: unknown) => {
                            const status = (err as { response?: { status?: number } })?.response?.status;
                            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                            setMpesaError(
                              msg ??
                                (status === 404
                                  ? 'No completed M-Pesa payment found for that code. The guest may not have completed the transaction, or the callback is still processing.'
                                  : 'Verification failed. Please try again.'),
                            );
                          })
                          .finally(() => setMpesaVerifying(false));
                      }}
                      disabled={mpesaVerifying || !mpesaCode}
                      className="w-full h-10 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-500 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {mpesaVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Verify code
                        </>
                      )}
                    </button>
                  </>
                )}

                {confirmTab === 'manual' && (
                  <>
                    <p className="text-xs text-gray-600">
                      Record a cash, card, or bank payment received at the desk. This creates a completed payment
                      row on booking <span className="font-mono font-semibold">{viewBooking.id}</span>.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <label>
                        <span className="text-xs font-medium text-gray-600">Amount (KES)</span>
                        <input
                          type="number"
                          min={1}
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                        />
                      </label>
                      <label>
                        <span className="text-xs font-medium text-gray-600">Method</span>
                        <select
                          value={manualMethod}
                          onChange={(e) => setManualMethod(e.target.value as 'cash' | 'card' | 'bank')}
                          className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 capitalize"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="bank">Bank</option>
                        </select>
                      </label>
                      <label>
                        <span className="text-xs font-medium text-gray-600">Date</span>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                        />
                      </label>
                      <label>
                        <span className="text-xs font-medium text-gray-600">Reference (optional)</span>
                        <input
                          type="text"
                          value={manualRef}
                          onChange={(e) => setManualRef(e.target.value)}
                          placeholder="Receipt # / slip code"
                          className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500"
                        />
                      </label>
                    </div>

                    {manualError && (
                      <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                        {manualError}
                      </p>
                    )}

                    <button
                      onClick={() => {
                        const amount = Number(manualAmount);
                        if (!Number.isFinite(amount) || amount <= 0) {
                          setManualError('Enter a valid amount.');
                          return;
                        }
                        setManualSubmitting(true);
                        setManualError('');
                        recordManualPayment({
                          booking_id: viewBooking.numericId,
                          amount,
                          payment_method: manualMethod,
                          payment_date: manualDate,
                          reference_number: manualRef.trim() || undefined,
                          status: 'completed',
                        })
                          .then(() => {
                            void fetchBookings();
                            setConfirmOpen(false);
                          })
                          .catch((err: unknown) => {
                            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                            setManualError(msg ?? 'Could not record the payment. Please try again.');
                          })
                          .finally(() => setManualSubmitting(false));
                      }}
                      disabled={manualSubmitting}
                      className="w-full h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {manualSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Recording…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Record payment
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

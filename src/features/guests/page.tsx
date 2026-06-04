import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Edit,
  Eye,
  FileText,
  Filter,
  LogIn,
  LogOut,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuestStore } from '@/app/store/guestStore';
import { createGuest, deleteGuest, updateGuest, type ApiGuest } from '@/lib/protectedEndpoints';

const BOOKING_STATUS_STYLES: Record<string, string> = {
  checked_in: 'bg-emerald-100 text-emerald-700',
  reserved: 'bg-blue-100 text-blue-700',
  pending: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-blue-100 text-blue-700',
  checked_out: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  partial: 'bg-blue-100 text-blue-700',
};

function formatStatus(status: string) {
  return status.replace('_', ' ');
}

function StatusBadge({ status, type }: { status: string; type: 'booking' | 'payment' }) {
  const styles = type === 'booking' ? BOOKING_STATUS_STYLES : PAYMENT_STATUS_STYLES;
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', styles[status] ?? 'bg-slate-100 text-slate-700')}>
      {formatStatus(status)}
    </span>
  );
}

interface Guest {
  numericId: number;
  guestId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  gender: string;
  nationality: string;
  phone: string;
  email: string;
  idType: string;
  idNumber: string;
  address: string;
  bookingId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
  paymentStatus: string;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  stayHistory: number;
  previousBookings: string[];
  notes: string;
}

function mapApiGuest(guest: ApiGuest): Guest {
  const booking = guest.bookings?.[0];
  const firstName = guest.first_name ?? '';
  const lastName = guest.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || `Guest ${guest.id}`;

  return {
    numericId: guest.id,
    guestId: `GST-${String(guest.id).padStart(3, '0')}`,
    fullName,
    firstName,
    lastName,
    gender: guest.gender ?? '',
    nationality: guest.nationality ?? '',
    phone: guest.phone ?? '',
    email: guest.email ?? '',
    idType: guest.id_type ?? '',
    idNumber: guest.id_number ?? '',
    address: guest.address ?? '',
    bookingId: booking?.booking_reference ?? '',
    roomNumber: booking?.room?.room_number ?? '',
    roomType: booking?.room?.room_type?.name ?? booking?.room?.roomType?.name ?? '',
    checkIn: booking?.check_in_date ? String(booking.check_in_date).slice(0, 10) : '',
    checkOut: booking?.check_out_date ? String(booking.check_out_date).slice(0, 10) : '',
    bookingStatus: booking?.status ?? 'reserved',
    paymentStatus: 'pending',
    amountPaid: 0,
    balance: Number(booking?.total_price ?? 0),
    paymentMethod: 'Pending',
    stayHistory: guest.total_stays ?? guest.bookings?.length ?? 0,
    previousBookings: guest.bookings?.slice(1).map((item) => item.booking_reference) ?? [],
    notes: '',
  };
}

function StatCard({ label, value, icon, className }: { label: string; value: string | number; icon: React.ReactNode; className: string }) {
  return (
    <div className={cn('rounded-2xl p-4 text-white shadow-lg', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-xl bg-white/20 p-2">{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-white/80">{label}</p>
    </div>
  );
}

interface GuestFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  nationality: string;
  idType: string;
  idNumber: string;
  address: string;
  city: string;
  country: string;
}

const emptyForm: GuestFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  nationality: '',
  idType: '',
  idNumber: '',
  address: '',
  city: '',
  country: '',
};

function GuestFormModal({ open, initial, onClose, onSave }: { open: boolean; initial: GuestFormState; onClose: () => void; onSave: (form: GuestFormState) => Promise<void> }) {
  const [form, setForm] = useState<GuestFormState>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initial);
      setErr('');
    }
  }, [open, initial]);

  if (!open) return null;

  const handle = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErr('First and last name are required.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-bold text-slate-900">Guest details</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              First name
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              Last name
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              Phone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              Gender
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal">
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              Nationality
              <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              ID type
              <select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal">
                <option value="">—</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="driver_license">Driver License</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              ID number
              <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="col-span-2 space-y-1 text-xs font-semibold text-slate-600">
              Address
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              City
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
            <label className="space-y-1 text-xs font-semibold text-slate-600">
              Country
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal" />
            </label>
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{err}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button onClick={onClose} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100">Cancel</button>
          <button onClick={handle} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save guest'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestsPage() {
  const apiGuests = useGuestStore((state) => state.guests);
  const storeError = useGuestStore((state) => state.error);
  const fetchApiGuests = useGuestStore((state) => state.fetchGuests);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);

  const guests: Guest[] = useMemo(() => apiGuests.map(mapApiGuest), [apiGuests]);

  useEffect(() => {
    void fetchApiGuests();
  }, [fetchApiGuests]);

  const filteredGuests = guests.filter((guest) => {
    const query = search.toLowerCase();
    const matchesSearch =
      guest.fullName.toLowerCase().includes(query) ||
      guest.roomNumber.includes(search) ||
      guest.guestId.toLowerCase().includes(query) ||
      guest.bookingId.toLowerCase().includes(query) ||
      guest.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || guest.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => ({
    total: guests.length,
    checkedIn: guests.filter((guest) => guest.bookingStatus === 'checked_in').length,
    todayCheckIns: guests.filter((guest) => guest.checkIn === today).length,
    todayCheckOuts: guests.filter((guest) => guest.checkOut === today).length,
  }), [guests, today]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handleAddGuest = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (guest: Guest) => {
    setEditing(guest);
    setModalOpen(true);
  };

  const handleSave = async (form: GuestFormState) => {
    const payload: Record<string, unknown> = { ...form };
    if (editing) {
      await updateGuest(editing.numericId, payload);
      showNotice(`${form.firstName} ${form.lastName} updated.`);
    } else {
      await createGuest(payload);
      showNotice(`${form.firstName} ${form.lastName} added to the guest list.`);
    }
    await fetchApiGuests();
  };

  const handleDelete = async (guest: Guest) => {
    if (!window.confirm(`Remove ${guest.fullName} from the guest list?`)) return;
    try {
      await deleteGuest(guest.numericId);
      showNotice(`${guest.fullName} was removed from the guest list.`);
      await fetchApiGuests();
    } catch (err) {
      showNotice(`Delete failed: ${(err as { message?: string })?.message ?? 'unknown'}`);
    }
  };

  const handleBooking = (guest: Guest) => {
    setSelectedGuest(guest);
    showNotice(`Viewing booking ${guest.bookingId || 'none'}.`);
  };

  const handleCheckIn = (guest: Guest) => {
    showNotice(`Use the Tape Chart to check ${guest.fullName} in (requires a booking).`);
  };

  const handleCheckOut = (guest: Guest) => {
    showNotice(`Use the Tape Chart to check ${guest.fullName} out (requires a booking).`);
  };

  const handleInvoice = (guest: Guest) => showNotice(`Invoice prepared for ${guest.fullName}: KES ${(guest.amountPaid + guest.balance).toLocaleString()}.`);

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Guests</h2>
          <p className="text-white/70 text-sm">Guest records, booking details, payments, and stay history</p>
        </div>
        <button onClick={handleAddGuest} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Add New Guest
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Guests" value={stats.total} icon={<Users className="w-5 h-5" />} className="bg-gradient-to-br from-blue-500 to-indigo-700" />
        <StatCard label="Checked In" value={stats.checkedIn} icon={<LogIn className="w-5 h-5" />} className="bg-gradient-to-br from-emerald-500 to-teal-700" />
        <StatCard label={`Check-ins (${today})`} value={stats.todayCheckIns} icon={<CalendarDays className="w-5 h-5" />} className="bg-gradient-to-br from-cyan-500 to-blue-700" />
        <StatCard label={`Check-outs (${today})`} value={stats.todayCheckOuts} icon={<LogOut className="w-5 h-5" />} className="bg-gradient-to-br from-rose-500 to-red-700" />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by guest name, room number, guest ID, phone, or booking ID..."
              className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {['all', 'checked_in', 'confirmed', 'pending', 'checked_out', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize transition',
                  statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                )}
              >
                {status === 'all' ? 'All' : formatStatus(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {storeError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700 shadow-sm">
          {storeError}
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-700 shadow-sm">
          {notice}
        </div>
      )}

      {selectedGuest && (
        <div className="rounded-2xl bg-white p-4 text-sm text-gray-700 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-gray-900">{selectedGuest.fullName}</p>
              <p className="mt-1">Booking {selectedGuest.bookingId || '—'} - Room {selectedGuest.roomNumber || '—'} - {formatStatus(selectedGuest.bookingStatus)}</p>
              <p className="mt-1 text-gray-500">{selectedGuest.phone} · {selectedGuest.email}</p>
            </div>
            <button onClick={() => setSelectedGuest(null)} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredGuests.map((guest) => (
          <div key={guest.guestId} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <UserRound className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">{guest.fullName}</h3>
                        {guest.stayHistory >= 3 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <BadgeCheck className="w-3 h-3" />
                            Returning
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{guest.guestId} · {guest.gender || '—'} · {guest.nationality || '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={guest.bookingStatus} type="booking" />
                    <StatusBadge status={guest.paymentStatus} type="payment" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Guest Information</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" />{guest.phone || '—'}</p>
                      <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" />{guest.email || '—'}</p>
                      <p>ID: <span className="font-semibold text-gray-800">{guest.idType ? `${guest.idType.toUpperCase()} ` : ''}{guest.idNumber || '—'}</span></p>
                      <p>Address: {guest.address || '—'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-blue-400">Booking Details</p>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>Booking ID: <span className="font-semibold">{guest.bookingId || '—'}</span></p>
                      <p>Room {guest.roomNumber || '—'} {guest.roomType ? `· ${guest.roomType}` : ''}</p>
                      <p>{guest.checkIn || '—'} to {guest.checkOut || '—'}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-emerald-500">Payment Information</p>
                    <div className="space-y-2 text-sm text-emerald-800">
                      <p>Paid: <span className="font-semibold">KES {guest.amountPaid.toLocaleString()}</span></p>
                      <p>Balance: <span className="font-semibold">KES {guest.balance.toLocaleString()}</span></p>
                      <p>Method: {guest.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-amber-500">Guest Activity</p>
                    <div className="space-y-2 text-sm text-amber-800">
                      <p>Stay history: <span className="font-semibold">{guest.stayHistory}</span> stays</p>
                      <p>Previous: {guest.previousBookings.length ? guest.previousBookings.join(', ') : 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 xl:w-52">
                <button onClick={() => handleEdit(guest)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-gray-100 px-2 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button onClick={() => handleDelete(guest)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-red-50 px-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button onClick={() => handleBooking(guest)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-blue-50 px-2 text-xs font-semibold text-blue-600 hover:bg-blue-100">
                  <Eye className="w-3.5 h-3.5" />
                  Booking
                </button>
                <button onClick={() => handleCheckIn(guest)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-100">
                  <LogIn className="w-3.5 h-3.5" />
                  Check-in
                </button>
                <button onClick={() => handleCheckOut(guest)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-rose-50 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-100">
                  <LogOut className="w-3.5 h-3.5" />
                  Check-out
                </button>
                <button onClick={() => handleInvoice(guest)} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  <FileText className="w-3.5 h-3.5" />
                  Invoice
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGuests.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          {guests.length === 0 ? 'No guests yet. Add a guest to get started.' : 'No guests match the selected search or filter.'}
        </div>
      )}

      <GuestFormModal
        open={modalOpen}
        initial={editing ? {
          firstName: editing.firstName,
          lastName: editing.lastName,
          email: editing.email,
          phone: editing.phone,
          gender: editing.gender,
          nationality: editing.nationality,
          idType: editing.idType,
          idNumber: editing.idNumber,
          address: editing.address,
          city: '',
          country: '',
        } : emptyForm}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

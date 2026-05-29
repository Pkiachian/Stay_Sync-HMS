import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INITIAL_GUESTS = [
  {
    guestId: 'GST-001',
    fullName: 'James Odhiambo',
    gender: 'Male',
    nationality: 'Kenyan',
    phone: '+254712345678',
    email: 'james@email.com',
    idNumber: 'KE123456',
    address: 'Westlands, Nairobi',
    bookingId: 'BK-2041',
    roomNumber: '301',
    roomType: 'Suite',
    checkIn: '2026-05-18',
    checkOut: '2026-05-21',
    numberOfGuests: 2,
    bookingStatus: 'checked_in',
    paymentStatus: 'paid',
    amountPaid: 45000,
    balance: 0,
    paymentMethod: 'M-Pesa',
    stayHistory: 3,
    previousBookings: ['BK-1190', 'BK-1578'],
    vip: true,
    notes: 'Prefers quiet rooms and late checkout.',
  },
  {
    guestId: 'GST-002',
    fullName: 'Amina Hassan',
    gender: 'Female',
    nationality: 'Somali',
    phone: '+254723456789',
    email: 'amina@email.com',
    idNumber: 'SO789012',
    address: 'Kilimani, Nairobi',
    bookingId: 'BK-2042',
    roomNumber: '205',
    roomType: 'Deluxe Twin',
    checkIn: '2026-05-19',
    checkOut: '2026-05-23',
    numberOfGuests: 1,
    bookingStatus: 'reserved',
    paymentStatus: 'partial',
    amountPaid: 12000,
    balance: 8000,
    paymentMethod: 'Card',
    stayHistory: 1,
    previousBookings: [],
    vip: false,
    notes: 'Airport pickup requested.',
  },
  {
    guestId: 'GST-003',
    fullName: 'Brian Mutua',
    gender: 'Male',
    nationality: 'Kenyan',
    phone: '+254734567890',
    email: 'brian@email.com',
    idNumber: 'KE234567',
    address: 'Nyali, Mombasa',
    bookingId: 'BK-2043',
    roomNumber: '401',
    roomType: 'Penthouse',
    checkIn: '2026-05-20',
    checkOut: '2026-05-25',
    numberOfGuests: 3,
    bookingStatus: 'reserved',
    paymentStatus: 'pending',
    amountPaid: 0,
    balance: 89000,
    paymentMethod: 'Pending',
    stayHistory: 5,
    previousBookings: ['BK-0975', 'BK-1412', 'BK-1880'],
    vip: true,
    notes: 'VIP guest. Prepare welcome package.',
  },
  {
    guestId: 'GST-004',
    fullName: 'Grace Wanjiru',
    gender: 'Female',
    nationality: 'Kenyan',
    phone: '+254745678901',
    email: 'grace@email.com',
    idNumber: 'KE345678',
    address: 'Lavington, Nairobi',
    bookingId: 'BK-2044',
    roomNumber: '108',
    roomType: 'Standard King',
    checkIn: '2026-05-13',
    checkOut: '2026-05-18',
    numberOfGuests: 1,
    bookingStatus: 'checked_out',
    paymentStatus: 'paid',
    amountPaid: 34000,
    balance: 0,
    paymentMethod: 'Cash',
    stayHistory: 2,
    previousBookings: ['BK-1510'],
    vip: false,
    notes: 'Requested invoice by email.',
  },
  {
    guestId: 'GST-005',
    fullName: 'Peter Otieno',
    gender: 'Male',
    nationality: 'Kenyan',
    phone: '+254756789012',
    email: 'peter@email.com',
    idNumber: 'KE456789',
    address: 'Kisumu CBD',
    bookingId: 'BK-2045',
    roomNumber: '110',
    roomType: 'Standard King',
    checkIn: '2026-05-17',
    checkOut: '2026-05-19',
    numberOfGuests: 2,
    bookingStatus: 'cancelled',
    paymentStatus: 'pending',
    amountPaid: 0,
    balance: 18000,
    paymentMethod: 'Pending',
    stayHistory: 4,
    previousBookings: ['BK-1231', 'BK-1664'],
    vip: false,
    notes: 'Cancelled due to travel delay.',
  },
];

type Guest = (typeof INITIAL_GUESTS)[number];

const BOOKING_STATUS_STYLES: Record<string, string> = {
  checked_in: 'bg-emerald-100 text-emerald-700',
  reserved: 'bg-blue-100 text-blue-700',
  checked_out: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
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

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const filteredGuests = guests.filter((guest) => {
    const query = search.toLowerCase();
    const matchesSearch =
      guest.fullName.toLowerCase().includes(query) ||
      guest.roomNumber.includes(search) ||
      guest.guestId.toLowerCase().includes(query) ||
      guest.bookingId.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || guest.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => ({
    total: guests.length,
    checkedIn: guests.filter((guest) => guest.bookingStatus === 'checked_in').length,
    todayCheckIns: guests.filter((guest) => guest.checkIn === '2026-05-20').length,
    todayCheckOuts: guests.filter((guest) => guest.checkOut === '2026-05-20').length,
    vip: guests.filter((guest) => guest.vip).length,
  }), [guests]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const updateGuestStatus = (guestId: string, status: Guest['bookingStatus']) => {
    setGuests((prev) => prev.map((guest) => guest.guestId === guestId ? { ...guest, bookingStatus: status } : guest));
  };

  const handleAddGuest = () => showNotice('Add New Guest is ready for a backend form connection.');
  const handleEdit = (guest: Guest) => { setSelectedGuest(guest); showNotice(`Editing ${guest.fullName}.`); };
  const handleDelete = (guest: Guest) => { setGuests((prev) => prev.filter((item) => item.guestId !== guest.guestId)); showNotice(`${guest.fullName} was removed from the guest list.`); };
  const handleBooking = (guest: Guest) => { setSelectedGuest(guest); showNotice(`Viewing booking ${guest.bookingId}.`); };
  const handleCheckIn = (guest: Guest) => { updateGuestStatus(guest.guestId, 'checked_in'); showNotice(`${guest.fullName} has been checked in.`); };
  const handleCheckOut = (guest: Guest) => { updateGuestStatus(guest.guestId, 'checked_out'); showNotice(`${guest.fullName} has been checked out.`); };
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Guests" value={stats.total} icon={<Users className="w-5 h-5" />} className="bg-gradient-to-br from-blue-500 to-indigo-700" />
        <StatCard label="Checked In" value={stats.checkedIn} icon={<LogIn className="w-5 h-5" />} className="bg-gradient-to-br from-emerald-500 to-teal-700" />
        <StatCard label="Today's Check-ins" value={stats.todayCheckIns} icon={<CalendarDays className="w-5 h-5" />} className="bg-gradient-to-br from-cyan-500 to-blue-700" />
        <StatCard label="Today's Check-outs" value={stats.todayCheckOuts} icon={<LogOut className="w-5 h-5" />} className="bg-gradient-to-br from-rose-500 to-red-700" />
        <StatCard label="VIP Guests" value={stats.vip} icon={<BadgeCheck className="w-5 h-5" />} className="bg-gradient-to-br from-amber-500 to-orange-700" />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by guest name, room number, guest ID, or booking ID..."
              className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {['all', 'checked_in', 'reserved', 'checked_out', 'cancelled'].map((status) => (
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
              <p className="mt-1">Booking {selectedGuest.bookingId} - Room {selectedGuest.roomNumber} - {formatStatus(selectedGuest.bookingStatus)}</p>
              <p className="mt-1 text-gray-500">{selectedGuest.notes}</p>
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
                        {guest.vip && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <BadgeCheck className="w-3 h-3" />
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{guest.guestId} - {guest.gender} - {guest.nationality}</p>
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
                      <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" />{guest.phone}</p>
                      <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" />{guest.email}</p>
                      <p>ID/Passport: <span className="font-semibold text-gray-800">{guest.idNumber}</span></p>
                      <p>Address: {guest.address}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-blue-400">Booking Details</p>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>Booking ID: <span className="font-semibold">{guest.bookingId}</span></p>
                      <p>Room {guest.roomNumber} - {guest.roomType}</p>
                      <p>{guest.checkIn} to {guest.checkOut}</p>
                      <p>{guest.numberOfGuests} guest{guest.numberOfGuests > 1 ? 's' : ''}</p>
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
                      <p className="italic">{guest.notes}</p>
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
          No guests match the selected search or filter.
        </div>
      )}
    </div>
  );
}

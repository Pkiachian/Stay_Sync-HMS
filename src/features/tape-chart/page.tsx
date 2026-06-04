import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, differenceInDays, format, isToday, isWeekend, startOfDay } from 'date-fns';
import {
  Ban,
  BedDouble,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Hash,
  LogIn,
  LogOut,
  MoveRight,
  Pencil,
  Phone,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useTapeChartStore } from '@/app/store/tapeChartStore';
import { cancelBooking, checkInBooking, checkOutBooking, updateBooking, type TapeChartResponse } from '@/lib/protectedEndpoints';
import { cn } from '@/lib/utils';

const DAYS = 30;
const ROW_HEIGHT = 56;
const ROOM_COL_WIDTH = 156;
const DAY_WIDTH = 42;

const STATUS_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  confirmed: { bg: '#f59e0b', border: '#d97706', label: 'Reserved' },
  checked_in: { bg: '#22c55e', border: '#16a34a', label: 'Checked-in' },
  checked_out: { bg: '#94a3b8', border: '#64748b', label: 'Checked-out' },
  cancelled: { bg: '#ef4444', border: '#dc2626', label: 'Cancelled' },
  pending: { bg: '#f59e0b', border: '#d97706', label: 'Pending' },
  overdue: { bg: '#ef4444', border: '#dc2626', label: 'Overdue/Issue' },
};

const ROOM_STATUS_BADGE: Record<string, { bg: string; label: string }> = {
  available: { bg: '#22c55e', label: 'Available' },
  occupied: { bg: '#ef4444', label: 'Occupied' },
  reserved: { bg: '#f59e0b', label: 'Reserved' },
  dirty: { bg: '#f59e0b', label: 'Cleaning' },
  cleaning: { bg: '#f59e0b', label: 'Cleaning' },
  maintenance: { bg: '#94a3b8', label: 'Maintenance' },
  blocked: { bg: '#94a3b8', label: 'Blocked' },
};

const phoneByGuest: Record<string, string> = {
  'James Odhiambo': '+254712345678',
  'Mary Wanjiku': '+254701112233',
  'Sandra Achieng': '+254767890123',
  'Brian Mutua': '+254734567890',
  'Aisha Mohamed': '+254723456789',
  'Peter Otieno': '+254756789012',
  'Fatuma Ali': '+254767890123',
  'John Kamau': '+254711223344',
  'Grace Wanjiru': '+254745678901',
  'David Kimani': '+254733445566',
  'Amina Hassan': '+254723456789',
  'Robert Mwangi': '+254700998877',
};

interface Booking {
  id: number;
  reference: string;
  guest_name: string;
  room_id: number;
  check_in: string;
  check_out: string;
  status: string;
  nights: number;
}

interface Room {
  id: number;
  number: string;
  floor: number;
  type_name: string;
  status: string;
  bookings: Booking[];
}

function SummaryCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className={cn('rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg', gradient)}>
      <div className="mb-2 opacity-85">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-white/80">{label}</p>
    </div>
  );
}

function BookingModal({ booking, room, onClose, onAction }: { booking: Booking; room: Room; onClose: () => void; onAction: (action: string) => void }) {
  const colors = STATUS_COLORS[booking.status] ?? STATUS_COLORS.confirmed;
  const phone = phoneByGuest[booking.guest_name] ?? '+254700000000';
  const paymentStatus = booking.status === 'checked_in' ? 'Paid' : booking.status === 'confirmed' ? 'Partial' : 'Pending';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="p-5 text-white" style={{ background: colors.bg }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium opacity-80">{booking.reference}</span>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-xl font-bold">{booking.guest_name}</h3>
            <p className="mt-1 text-sm opacity-80">{room.type_name} - Room {room.number}</p>
          </div>

          <div className="space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Detail icon={<Calendar className="h-4 w-4 text-gray-400" />} label="Check-in" value={format(new Date(booking.check_in), 'MMM dd, yyyy')} />
              <Detail icon={<Calendar className="h-4 w-4 text-gray-400" />} label="Check-out" value={format(new Date(booking.check_out), 'MMM dd, yyyy')} />
              <Detail icon={<Hash className="h-4 w-4 text-gray-400" />} label="Nights" value={`${booking.nights}`} />
              <Detail icon={<User className="h-4 w-4 text-gray-400" />} label="Status" value={colors.label} />
              <Detail icon={<Phone className="h-4 w-4 text-gray-400" />} label="Phone" value={phone} />
              <Detail icon={<CreditCard className="h-4 w-4 text-gray-400" />} label="Payment" value={paymentStatus} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 px-5 pb-5">
            {[
              { label: 'Edit', icon: Pencil, className: 'bg-blue-600 text-white hover:bg-blue-700' },
              { label: 'Move Room', icon: MoveRight, className: 'bg-violet-600 text-white hover:bg-violet-700' },
              { label: 'Extend Stay', icon: Clock, className: 'bg-amber-500 text-white hover:bg-amber-600' },
              { label: 'Cancel', icon: Ban, className: 'bg-red-50 text-red-600 hover:bg-red-100' },
              { label: 'Check In', icon: LogIn, className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
              { label: 'Check Out', icon: LogOut, className: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
            ].map(({ label, icon: Icon, className }) => (
              <button key={label} onClick={() => onAction(label)} className={cn('flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-colors', className)}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
      {icon}
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="truncate text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function mapApiToTape(data: TapeChartResponse): Room[] {
  return data.rooms.map((room) => ({
    id: room.id,
    number: room.number,
    floor: room.floor,
    type_name: room.type_name,
    status: room.status,
    bookings: room.bookings.map((b, idx) => {
      const inDate = String(b.check_in).slice(0, 10);
      const outDate = String(b.check_out).slice(0, 10);
      const nights = Math.max(1, Math.round((new Date(outDate).getTime() - new Date(inDate).getTime()) / 86_400_000));
      const guestName = b.guest_name ?? (b.guest ? `${b.guest.first_name ?? ''} ${b.guest.last_name ?? ''}`.trim() || 'Guest' : 'Guest');
      return {
        id: b.booking_id ?? b.id ?? idx,
        reference: b.booking_reference ?? b.reference ?? `BK-${(b.booking_id ?? idx)}`,
        guest_name: guestName,
        room_id: room.id,
        check_in: inDate,
        check_out: outDate,
        status: b.status,
        nights,
      };
    }),
  }));
}

export default function TapeChartPage() {
  const fetchTapeChart = useTapeChartStore((state) => state.fetchTapeChart);
  const tapeData = useTapeChartStore((state) => state.data);
  const tapeError = useTapeChartStore((state) => state.error);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; room: Room } | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const dates = Array.from({ length: DAYS }, (_, i) => addDays(startDate, i));
  const roomTypes = Array.from(new Set(rooms.map((room) => room.type_name)));
  const floorOptions = Array.from(new Set(rooms.map((room) => room.floor))).sort();

  useEffect(() => {
    void fetchTapeChart(format(startDate, 'yyyy-MM-dd'), format(addDays(startDate, DAYS - 1), 'yyyy-MM-dd'));
  }, [fetchTapeChart, startDate]);

  useEffect(() => {
    if (tapeData?.rooms) setRooms(mapApiToTape(tapeData));
  }, [tapeData]);

  const filteredRooms = rooms.filter((room) => {
    const matchesType = roomTypeFilter === 'all' || room.type_name === roomTypeFilter;
    const matchesFloor = floorFilter === 'all' || String(room.floor) === floorFilter;
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter || room.bookings.some((booking) => booking.status === statusFilter);
    return matchesType && matchesFloor && matchesStatus;
  });

  const floors = Array.from(new Set(filteredRooms.map((room) => room.floor))).sort();

  const showActionMessage = (message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(''), 3500);
  };

  const refreshChart = () => {
    void fetchTapeChart(format(startDate, 'yyyy-MM-dd'), format(addDays(startDate, DAYS - 1), 'yyyy-MM-dd'));
  };

  const handleBookingAction = async (action: string) => {
    if (!selectedBooking) return;
    const { booking, room } = selectedBooking;

    if (action === 'Edit') {
      showActionMessage(`Editing ${booking.reference} (not implemented in tape chart).`);
      return;
    }

    if (action === 'Move Room') {
      const targetRoom = rooms.find((candidate) => candidate.id !== room.id && candidate.status === 'available') ?? rooms.find((candidate) => candidate.id !== room.id);
      if (!targetRoom) {
        showActionMessage('No alternate room available to move to.');
        return;
      }
      try {
        await updateBooking(booking.id, { room_id: targetRoom.id });
        showActionMessage(`${booking.guest_name} moved to Room ${targetRoom.number}.`);
        setSelectedBooking(null);
        refreshChart();
      } catch (err) {
        showActionMessage(`Move failed: ${(err as { message?: string })?.message ?? 'unknown'}`);
      }
      return;
    }

    try {
      if (action === 'Extend Stay') {
        const newCheckout = format(addDays(new Date(booking.check_out), 1), 'yyyy-MM-dd');
        await updateBooking(booking.id, { check_out: newCheckout });
        showActionMessage(`Stay extended for ${booking.reference}.`);
        setSelectedBooking(null);
        refreshChart();
        return;
      }
      if (action === 'Cancel') {
        await cancelBooking(booking.id);
        showActionMessage(`${booking.reference} cancelled.`);
        setSelectedBooking(null);
        refreshChart();
        return;
      }
      if (action === 'Check In') {
        await checkInBooking(booking.id);
        showActionMessage(`${booking.reference} checked in.`);
        setSelectedBooking(null);
        refreshChart();
        return;
      }
      if (action === 'Check Out') {
        await checkOutBooking(booking.id);
        showActionMessage(`${booking.reference} checked out.`);
        setSelectedBooking(null);
        refreshChart();
        return;
      }
    } catch (err) {
      showActionMessage(`Action failed: ${(err as { message?: string })?.message ?? 'unknown'}`);
    }
  };

  const getBookingStyle = (booking: Booking) => {
    const checkIn = startOfDay(new Date(booking.check_in));
    const checkOut = startOfDay(new Date(booking.check_out));
    const colors = STATUS_COLORS[booking.status] ?? STATUS_COLORS.confirmed;
    const startOffset = differenceInDays(checkIn, startDate);
    const duration = differenceInDays(checkOut, checkIn);

    if (startOffset + duration < 0 || startOffset >= DAYS) return null;

    const clampedStart = Math.max(0, startOffset);
    const clampedDuration = Math.min(duration + startOffset, DAYS) - clampedStart;
    if (clampedDuration <= 0) return null;

    return {
      left: clampedStart * DAY_WIDTH + 2,
      width: clampedDuration * DAY_WIDTH - 4,
      colors,
    };
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {tapeError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
          {tapeError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard label="Occupied Rooms" value={rooms.filter((r) => r.status === 'occupied').length} icon={<BedDouble className="h-5 w-5" />} gradient="from-red-500 to-red-700" />
        <SummaryCard label="Available Rooms" value={rooms.filter((r) => r.status === 'available').length} icon={<BedDouble className="h-5 w-5" />} gradient="from-emerald-500 to-teal-700" />
        <SummaryCard label="Reservations" value={rooms.reduce((sum, r) => sum + r.bookings.length, 0)} icon={<LogIn className="h-5 w-5" />} gradient="from-blue-500 to-indigo-700" />
        <SummaryCard label="Checked-in" value={rooms.reduce((sum, r) => sum + r.bookings.filter((b) => b.status === 'checked_in').length, 0)} icon={<LogOut className="h-5 w-5" />} gradient="from-amber-500 to-orange-700" />
        <SummaryCard label="Total Rooms" value={rooms.length} icon={<Sparkles className="h-5 w-5" />} gradient="from-violet-500 to-purple-700" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Tape Chart</h2>
          <p className="text-sm text-white/70">{format(startDate, 'MMM dd')} - {format(addDays(startDate, DAYS - 1), 'MMM dd, yyyy')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(event) => setStartDate(startOfDay(new Date(event.target.value)))}
            className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-gray-700 outline-none"
          />
          <button onClick={() => setStartDate((date) => addDays(date, -7))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setStartDate(startOfDay(new Date()))} className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50">
            Today
          </button>
          <button onClick={() => setStartDate((date) => addDays(date, 7))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select value={roomTypeFilter} onChange={(event) => setRoomTypeFilter(event.target.value)} className="h-9 rounded-xl border border-gray-200 px-3 text-sm outline-none">
            <option value="all">All room types</option>
            {roomTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)} className="h-9 rounded-xl border border-gray-200 px-3 text-sm outline-none">
            <option value="all">All floors</option>
            {floorOptions.map((floor) => <option key={floor} value={floor}>Floor {floor}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-xl border border-gray-200 px-3 text-sm outline-none">
            <option value="all">All statuses</option>
            <option value="checked_in">Checked-in</option>
            <option value="confirmed">Reserved</option>
            <option value="available">Available</option>
            <option value="dirty">Cleaning</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: 'Checked-in', color: STATUS_COLORS.checked_in.bg },
            { label: 'Reserved', color: STATUS_COLORS.confirmed.bg },
            { label: 'Overdue/Issue', color: STATUS_COLORS.overdue.bg },
            { label: 'Maintenance', color: ROOM_STATUS_BADGE.maintenance.bg },
            { label: 'Cleaning', color: ROOM_STATUS_BADGE.cleaning.bg },
            { label: 'Available', color: ROOM_STATUS_BADGE.available.bg },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">Use the booking modal actions to move rooms, extend stays, cancel bookings, or check guests in and out.</p>
        {actionMessage && <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{actionMessage}</p>}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white/90 shadow-xl backdrop-blur">
        <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-white">
          <div className="flex shrink-0 items-center gap-2 border-r border-gray-200 bg-gray-50 px-3" style={{ width: ROOM_COL_WIDTH, height: ROW_HEIGHT }}>
            <BedDouble className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">ROOM</span>
          </div>

          <div className="flex overflow-hidden" ref={scrollRef}>
            {dates.map((date) => (
              <div
                key={date.toISOString()}
                style={{ width: DAY_WIDTH, minWidth: DAY_WIDTH }}
                className={cn('flex flex-col items-center justify-center border-r border-gray-100 py-1', isToday(date) ? 'bg-blue-50' : isWeekend(date) ? 'bg-gray-50' : 'bg-white')}
              >
                <span className={cn('text-[10px] font-medium', isToday(date) ? 'text-blue-600' : 'text-gray-400')}>{format(date, 'EEE')}</span>
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold', isToday(date) ? 'bg-blue-500 text-white' : 'text-gray-700')}>
                  {format(date, 'd')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {floors.map((floor) => (
            <div key={floor}>
              <div className="flex items-center border-b border-gray-200 bg-gray-50 px-3 py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Floor {floor}</span>
              </div>

              {filteredRooms.filter((room) => room.floor === floor).map((room) => {
                const statusBadge = ROOM_STATUS_BADGE[room.status] ?? ROOM_STATUS_BADGE.available;
                return (
                  <div key={room.id} className="group flex border-b border-gray-100 transition-colors hover:bg-blue-50/30" style={{ height: ROW_HEIGHT }}>
                    <div className="flex shrink-0 items-center gap-2 border-r border-gray-200 px-3" style={{ width: ROOM_COL_WIDTH }}>
                      <div>
                        <p className="text-sm font-bold text-gray-800">#{room.number}</p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusBadge.bg }} />
                          <p className="text-[10px] text-gray-400">{room.type_name} - {statusBadge.label}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex-1 overflow-hidden">
                      {dates.map((date, index) => (
                        <div
                          key={date.toISOString()}
                          className={cn('absolute bottom-0 top-0 border-r border-gray-100', isToday(date) ? 'bg-blue-50/50' : isWeekend(date) ? 'bg-gray-50/50' : '')}
                          style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
                        />
                      ))}

                      {room.bookings.map((booking) => {
                        const style = getBookingStyle(booking);
                        if (!style) return null;
                        return (
                          <motion.button
                            key={booking.id}
                            whileHover={{ scale: 1.02, zIndex: 10 }}
                            onClick={() => setSelectedBooking({ booking, room })}
                            className="absolute bottom-2 top-2 cursor-pointer overflow-hidden rounded-lg text-left shadow-sm"
                            style={{
                              left: style.left,
                              width: style.width,
                              background: style.colors.bg,
                              borderLeft: `3px solid ${style.colors.border}`,
                            }}
                            title={`${booking.guest_name} - Room ${room.number} - ${booking.check_in} to ${booking.check_out} - ${style.colors.label} - ${booking.nights} nights`}
                          >
                            <div className="flex h-full flex-col justify-center px-2 py-1">
                              <p className="truncate text-xs font-semibold leading-tight text-white">{booking.guest_name}</p>
                              {style.width > 72 && (
                                <p className="truncate text-[10px] text-white/75">R{room.number} - {booking.nights}n - {style.colors.label}</p>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedBooking && (
        <BookingModal booking={selectedBooking.booking} room={selectedBooking.room} onClose={() => setSelectedBooking(null)} onAction={handleBookingAction} />
      )}
    </div>
  );
}

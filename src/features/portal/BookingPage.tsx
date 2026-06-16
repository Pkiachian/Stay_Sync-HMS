import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BedDouble, CalendarCheck, Check, CreditCard, Phone, Printer, Sparkles } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import {
  buildPortalInvoiceUrl,
  createPortalBooking,
  fetchPortalAvailableRooms,
  fetchPortalRoomTypes,
  lookupPortalBooking,
  payPortalDeposit,
  type MpesaStkResponse,
  type PortalAvailableRoom,
  type PortalBooking,
  type PortalRoomType,
} from '@/lib/portalApi';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export default function PortalBookingPage() {
  const [params] = useSearchParams();

  const [checkIn,    setCheckIn]    = useState(params.get('checkIn') ?? todayIso());
  const [checkOut,   setCheckOut]   = useState(params.get('checkOut') ?? todayIso());
  const [guests,    ]                = useState(Number(params.get('guests') ?? '2'));
  const [roomTypeId, setRoomTypeId] = useState<string>(params.get('roomTypeId') ?? '');

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [adults,    setAdults]    = useState(guests);
  const [children,  setChildren]  = useState(0);
  const [special,   setSpecial]   = useState('');

  const [roomTypes,   setRoomTypes]   = useState<PortalRoomType[]>([]);
  const [rooms,       setRooms]       = useState<PortalAvailableRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState<PortalBooking | null>(null);

  const nights = calcNights(checkIn, checkOut);
  const selectedRoomType = useMemo(
    () => roomTypes.find((rt) => String(rt.id) === String(roomTypeId)) ?? null,
    [roomTypes, roomTypeId],
  );
  const selectedRoomObj = useMemo(
    () => rooms.find((r) => r.id === selectedRoom) ?? null,
    [rooms, selectedRoom],
  );
  const totalEstimate = useMemo(() => {
    if (!selectedRoomObj) return 0;
    const rt = selectedRoomObj.room_type ?? selectedRoomObj.roomType;
    const base = Number(rt?.base_price ?? 0);
    return Math.round(base * nights * 1.16);
  }, [selectedRoomObj, nights]);

  useEffect(() => {
    fetchPortalRoomTypes().then((res) => setRoomTypes(res.data.data ?? [])).catch(() => setRoomTypes([]));
  }, []);

  useEffect(() => {
    if (nights < 1) {
      setRooms([]);
      setSelectedRoom(null);
      return;
    }
    setLoadingRooms(true);
    setSelectedRoom(null);
    fetchPortalAvailableRooms({
      checkIn,
      checkOut,
      ...(roomTypeId ? { roomTypeId: Number(roomTypeId) } : {}),
    })
      .then((res) => setRooms(res.data.data ?? []))
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, [checkIn, checkOut, roomTypeId, nights]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedRoom) {
      setError('Please select an available room.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('First name, last name, and phone are required.');
      return;
    }
    const rt = selectedRoomObj?.room_type ?? selectedRoomObj?.roomType;
    const payload = {
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      email:      email.trim() || null,
      phone:      phone.trim(),
      room_id:    selectedRoom,
      room_type_id: rt?.id ?? Number(roomTypeId),
      check_in_date:  checkIn,
      check_out_date: checkOut,
      num_adults:     adults,
      num_children:   children,
      special_requests: special.trim() || null,
    };
    setSubmitting(true);
    try {
      const res = await createPortalBooking(payload);
      setSuccess(res.data.data ?? null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not create the booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <BookingConfirmation
      booking={success}
      phone={phone}
      onPhoneChange={setPhone}
    />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/portal" className="inline-flex items-center gap-1 text-xs font-medium text-cyan-200 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
      </Link>

      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Complete your booking</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Reserve your stay</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Pick your dates and a room, then add your details to confirm.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {/* Stay details */}
          <section className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">1 · Your stay</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onCheckInChange={setCheckIn}
                  onCheckOutChange={setCheckOut}
                  minDate={todayIso()}
                />
              </div>
              <label>
                <span className="text-xs font-medium text-slate-600">Room type</span>
                <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200">
                  <option value="">Any</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} — KES {Number(rt.base_price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="text-xs font-medium text-slate-600">Adults</span>
                  <input type="number" min={1} max={8} value={adults} onChange={(e) => setAdults(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>
                <label>
                  <span className="text-xs font-medium text-slate-600">Children</span>
                  <input type="number" min={0} max={6} value={children} onChange={(e) => setChildren(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                </label>
              </div>
            </div>
          </section>

          {/* Room selection */}
          <section className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">2 · Choose a room</h2>
            {nights < 1 ? (
              <p className="mt-3 text-sm text-rose-600">Check-out must be after check-in.</p>
            ) : loadingRooms ? (
              <p className="mt-3 text-sm text-slate-500">Loading available rooms…</p>
            ) : rooms.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No rooms available for those dates. Try different dates or room type.</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {rooms.map((r) => {
                  const rt = r.room_type ?? r.roomType;
                  const isSelected = selectedRoom === r.id;
                  return (
                    <button key={r.id} type="button" onClick={() => setSelectedRoom(r.id)}
                      className={`rounded-xl border p-3 text-left transition ${isSelected ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200' : 'border-slate-200 bg-white hover:border-cyan-300'}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">Room {r.room_number}</p>
                        {isSelected && <Check className="h-4 w-4 text-cyan-600" />}
                      </div>
                      <p className="text-xs text-slate-500">{rt?.name} · Floor {r.floor}</p>
                      <p className="mt-1 text-sm font-semibold text-cyan-700">KES {Number(rt?.base_price).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ night</span></p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Guest details */}
          <section className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">3 · Your details</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-slate-600">First name *</span>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              </label>
              <label>
                <span className="text-xs font-medium text-slate-600">Last name *</span>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              </label>
              <label>
                <span className="text-xs font-medium text-slate-600">Phone *</span>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2547XX XXX XXX"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              </label>
              <label>
                <span className="text-xs font-medium text-slate-600">Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-slate-600">Special requests</span>
                <textarea value={special} onChange={(e) => setSpecial(e.target.value)} rows={2}
                  placeholder="Late check-in, extra towels, dietary needs, etc."
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              </label>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Booking summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Dates</dt><dd className="font-semibold">{checkIn} → {checkOut}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Nights</dt><dd className="font-semibold">{nights}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Guests</dt><dd className="font-semibold">{adults + children} ({adults} adults, {children} children)</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Room</dt><dd className="font-semibold">{selectedRoomObj ? `${selectedRoomObj.room_number} · ${(selectedRoomObj.room_type ?? selectedRoomObj.roomType)?.name}` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Room type</dt><dd className="font-semibold">{selectedRoomType?.name ?? 'Any'}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <dt className="font-semibold">Estimated total</dt>
                <dd className="font-bold text-cyan-700">KES {totalEstimate.toLocaleString()}</dd>
              </div>
            </dl>
            {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
            <button type="submit" disabled={submitting || nights < 1 || !selectedRoom}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60">
              {submitting ? 'Confirming…' : <><BedDouble className="h-4 w-4" /> Confirm booking</>}
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">You can pay a deposit now with M-Pesa on the next step, or pay on arrival.</p>
          </section>

          <section className="rounded-2xl border border-white/14 bg-slate-950/55 p-4 text-cyan-50/85 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Need help?</p>
            <p className="mt-1 text-xs leading-5">Our concierge can arrange airport pickup, dietary meals, and tour bookings on request.</p>
            <Link to="/portal/concierge" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-200 hover:text-white">
              <Sparkles className="h-3 w-3" /> Open concierge
            </Link>
          </section>
        </aside>
      </form>
    </div>
  );
}

type DepositState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; data: MpesaStkResponse }
  | { status: 'error'; message: string };

function BookingConfirmation({
  booking,
  phone,
  onPhoneChange,
}: {
  booking: PortalBooking;
  phone: string;
  onPhoneChange: (v: string) => void;
}) {
  const [deposit, setDeposit] = useState<DepositState>({ status: 'idle' });
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [printing, setPrinting] = useState(false);

  const total = Number(booking.total_price) || 0;
  const suggested = Math.max(100, Math.round(total * 0.2));

  useEffect(() => {
    if (depositAmount === 0) setDepositAmount(suggested);
  }, [suggested, depositAmount]);

  async function handlePayDeposit() {
    if (!phone.trim() || depositAmount < 1) return;
    setDeposit({ status: 'sending' });
    try {
      const res = await payPortalDeposit({
        phone: phone.trim(),
        amount: depositAmount,
        reference: booking.booking_reference.slice(0, 12),
      });
      setDeposit({ status: 'sent', data: res.data.data.stk });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeposit({ status: 'error', message: msg ?? 'M-Pesa request failed. Please try again or pay on arrival.' });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/14 bg-white/95 p-8 text-center text-slate-900 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold">Booking confirmed</h2>
        <p className="mt-2 text-sm text-slate-500">
          We sent the details to {booking.guest?.email || 'your email'}. Keep your reference safe — you will need it to manage your stay.
        </p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="text-xs uppercase tracking-wide text-slate-500">Booking reference</p>
          <p className="mt-1 text-xl font-bold tracking-widest text-cyan-700">{booking.booking_reference}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-slate-500">Check-in</p><p className="font-semibold">{booking.check_in_date}</p></div>
            <div><p className="text-xs text-slate-500">Check-out</p><p className="font-semibold">{booking.check_out_date}</p></div>
            <div><p className="text-xs text-slate-500">Room</p><p className="font-semibold">{booking.room?.room_number} · {booking.room?.room_type?.name ?? booking.room?.roomType?.name}</p></div>
            <div><p className="text-xs text-slate-500">Total</p><p className="font-semibold">KES {Number(booking.total_price).toLocaleString()}</p></div>
          </div>
          <button type="button" disabled={printing} onClick={() => {
            const guestLast = (booking.guest?.last_name ?? '').trim();
            if (!guestLast) return;
            setPrinting(true);
            void lookupPortalBooking({ reference: booking.booking_reference, lastName: guestLast })
              .then((res) => {
                const token = res.data.data.access_token;
                const url = buildPortalInvoiceUrl(booking.id, token, 'invoice');
                window.open(url, '_blank', 'noreferrer');
              })
              .catch(() => {
                /* swallow — the user can try from the reservations page */
              })
              .finally(() => setPrinting(false));
          }}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-60">
            <Printer className="h-3.5 w-3.5" /> {printing ? 'Opening…' : 'Print invoice'}
          </button>
        </div>

        {deposit.status !== 'sent' && (
          <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-left">
            <div className="flex items-center gap-2 text-cyan-800">
              <CreditCard className="h-4 w-4" />
              <p className="text-sm font-bold">Pay a deposit now (optional)</p>
            </div>
            <p className="mt-1 text-xs text-cyan-900/80">
              Secure your booking with a 20% M-Pesa deposit, or skip and pay the full balance on arrival.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-medium text-cyan-900">M-Pesa phone</span>
                <div className="mt-1 flex items-center gap-1 rounded-lg border border-cyan-200 bg-white px-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200">
                  <Phone className="h-3.5 w-3.5 text-cyan-600" />
                  <input type="tel" value={phone} onChange={(e) => onPhoneChange(e.target.value)} placeholder="+2547XX XXX XXX"
                    className="h-9 w-full bg-transparent text-sm focus:outline-none" />
                </div>
              </label>
              <label>
                <span className="text-xs font-medium text-cyan-900">Deposit (KES)</span>
                <input type="number" min={1} max={total || 1000000} value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-lg border border-cyan-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              </label>
            </div>
            {deposit.status === 'error' && (
              <p className="mt-2 text-xs font-medium text-rose-700">{deposit.message}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={handlePayDeposit} disabled={deposit.status === 'sending' || !phone.trim() || depositAmount < 1}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">
                {deposit.status === 'sending' ? 'Sending prompt…' : <><CreditCard className="h-4 w-4" /> Pay KES {depositAmount.toLocaleString()} with M-Pesa</>}
              </button>
              <Link to={`/portal/reservations?ref=${booking.booking_reference}&last=${booking.guest?.last_name ?? ''}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Pay on arrival
              </Link>
            </div>
          </div>
        )}

        {deposit.status === 'sent' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
            <div className="flex items-center gap-2 text-emerald-800">
              <Check className="h-4 w-4" />
              <p className="text-sm font-bold">M-Pesa prompt sent</p>
            </div>
            <p className="mt-1 text-xs text-emerald-900/80">{deposit.data.CustomerMessage}</p>
            <p className="mt-1 text-[11px] text-emerald-900/70">Reference: {deposit.data.CheckoutRequestID}. We will email you once the deposit is confirmed.</p>
          </motion.div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`/portal/reservations?ref=${booking.booking_reference}&last=${booking.guest?.last_name ?? ''}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500">
            <CalendarCheck className="h-4 w-4" /> Manage my reservation
          </Link>
          <Link to="/portal"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

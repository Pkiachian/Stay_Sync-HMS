import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarRange,
  Clock,
  FileText,
  Hash,
  KeyRound,
  Plus,
  Printer,
  Receipt,
  Search,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { buildPortalInvoiceUrl, cancelPortalBooking, lookupPortalBooking, type PortalBooking } from '@/lib/portalApi';

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-700',
  confirmed:   'bg-blue-100 text-blue-700',
  checked_in:  'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-500',
  cancelled:   'bg-red-100 text-red-600',
};

function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000));
}

type ActionKey = 'modify' | 'upgrade' | 'guests' | 'extend';

const ACTION_LABELS: Record<ActionKey, string> = {
  modify:  'Modify dates',
  upgrade: 'Upgrade room',
  guests:  'Add guests',
  extend:  'Extend stay',
};

export default function PortalReservationsPage() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get('ref') ?? '');
  const [lastName,  setLastName]  = useState(params.get('last') ?? '');
  const [booking,   setBooking]   = useState<PortalBooking | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [actionNotice, setActionNotice] = useState<string>('');
  const [cancelling, setCancelling] = useState(false);

  async function doLookup(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    setActionNotice('');
    if (!reference.trim() || !lastName.trim()) {
      setError('Please enter both your booking reference and last name.');
      return;
    }
    setLoading(true);
    try {
      const res = await lookupPortalBooking({ reference: reference.trim(), lastName: lastName.trim() });
      setBooking(res.data.data.booking ?? null);
      setAccessToken(res.data.data.access_token ?? '');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'No booking found for those details.');
      setBooking(null);
      setAccessToken('');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.get('ref') && params.get('last')) {
      void doLookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCancel() {
    if (!booking) return;
    if (!confirm(`Cancel booking ${booking.booking_reference}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      const res = await cancelPortalBooking(booking.id, lastName.trim());
      setBooking(res.data.data ?? null);
      setActionNotice('Your booking has been cancelled.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not cancel the booking.');
    } finally {
      setCancelling(false);
    }
  }

  function handleAction(key: ActionKey) {
    setActionNotice(`${ACTION_LABELS[key]} — please contact the front desk to complete this request. (Demo: live modification coming soon.)`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Manage your stay</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Reservation Management</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Look up a booking with your reference and last name — no login required.</p>
      </header>

      <form onSubmit={doLookup} className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Find your booking</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto]">
          <label>
            <span className="text-xs font-medium text-slate-600">Booking reference</span>
            <div className="relative mt-1">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="BK-XXXXXX"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
            </div>
          </label>
          <label>
            <span className="text-xs font-medium text-slate-600">Last name</span>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="As on the booking"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
            </div>
          </label>
          <button type="submit" disabled={loading}
            className="mt-[22px] inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">
            <Search className="h-4 w-4" /> {loading ? 'Searching…' : 'Look up'}
          </button>
        </div>
        {error && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </p>
        )}
      </form>

      {actionNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {actionNotice}
        </div>
      )}

      <AnimatePresence>
        {booking && (
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking</p>
                  <p className="mt-1 text-xl font-bold tracking-widest text-cyan-700">{booking.booking_reference}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Guest: <span className="font-semibold text-slate-700">{booking.guest?.first_name} {booking.guest?.last_name}</span>
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Info label="Check-in"  value={booking.check_in_date}  icon={CalendarRange} />
                <Info label="Check-out" value={booking.check_out_date} icon={CalendarRange} />
                <Info label="Nights"    value={String(nightsBetween(booking.check_in_date, booking.check_out_date))} icon={Clock} />
                <Info label="Room"      value={`${booking.room?.room_number} · ${(booking.room?.room_type ?? booking.room?.roomType)?.name}`} icon={KeyRound} />
                <Info label="Guests"    value={`${booking.num_adults ?? 0} adults${(booking.num_children ?? 0) > 0 ? `, ${booking.num_children} children` : ''}`} icon={Users} />
                <Info label="Total"     value={`KES ${Number(booking.total_price).toLocaleString()}`} />
                {booking.special_requests && <Info label="Requests" value={booking.special_requests} />}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-4">
                <ActionButton icon={CalendarRange} onClick={() => handleAction('modify')}>Modify dates</ActionButton>
                <ActionButton icon={ArrowUpRight}  onClick={() => handleAction('upgrade')}>Upgrade room</ActionButton>
                <ActionButton icon={Users}         onClick={() => handleAction('guests')}>Add guests</ActionButton>
                <ActionButton icon={Plus}          onClick={() => handleAction('extend')}>Extend stay</ActionButton>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Documents</p>
                <a href={buildPortalInvoiceUrl(booking.id, accessToken, 'invoice')} target="_blank" rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">
                  <Printer className="h-3.5 w-3.5" /> Print invoice
                </a>
                <a href={buildPortalInvoiceUrl(booking.id, accessToken, 'receipt')} target="_blank" rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-700">
                  <Receipt className="h-3.5 w-3.5" /> Print receipt
                </a>
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <FileText className="h-3 w-3" /> PDF · opens in a new tab
                </span>
              </div>
            </div>

            {booking.status !== 'cancelled' && booking.status !== 'checked_in' && booking.status !== 'checked_out' && (
              <button onClick={handleCancel} disabled={cancelling}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60">
                <XCircle className="h-4 w-4" /> {cancelling ? 'Cancelling…' : 'Cancel this booking'}
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {!booking && !loading && !error && (
        <div className="rounded-2xl border border-white/14 bg-white/5 p-6 text-center text-sm text-cyan-50/70">
          Enter your booking reference and last name above to see your reservation.
        </div>
      )}

      <p className="text-center text-xs text-cyan-100/60">
        Need to book a new stay? <Link to="/portal/booking" className="font-semibold text-cyan-200 hover:text-white">Book now</Link>.
      </p>
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, onClick, children }: { icon: React.ComponentType<{ className?: string }>; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} type="button"
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

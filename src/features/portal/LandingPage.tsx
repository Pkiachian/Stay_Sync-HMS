import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Coffee,
  CreditCard,
  Gift,
  KeyRound,
  MessageCircle,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { fetchPortalRoomTypes, type PortalRoomType } from '@/lib/portalApi';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { PACKAGES } from './PackageDetailsPage';

const SERVICES = [
  { to: '/portal/check-in',    label: 'Online Check-In',      desc: 'Upload ID, sign forms, pick arrival time',          Icon: Sparkles },
  { to: '/portal/key',         label: 'Digital Room Key',     desc: 'Mobile, QR, NFC, and Bluetooth access',              Icon: KeyRound },
  { to: '/portal/reservations',label: 'Reservation Management', desc: 'Modify dates, upgrade rooms, cancel, or extend',  Icon: CalendarDays },
  { to: '/portal/room-service',label: 'Room Service',         desc: 'Order from breakfast, lunch, dinner, drinks',       Icon: Coffee },
  { to: '/portal/concierge',   label: 'Concierge Services',   desc: 'Taxi, airport transfer, wake-up, laundry, tours',   Icon: BedDouble },
  { to: '/portal/billing',     label: 'Billing & Payments',   desc: 'View invoices, download receipts, pay balances',    Icon: CreditCard },
  { to: '/portal/loyalty',     label: 'Loyalty Program',      desc: 'Track points, tier status, and rewards',           Icon: Gift },
  { to: '/portal/chat',        label: '24/7 AI Concierge',    desc: 'Chat with our AI assistant any time',               Icon: MessageCircle },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function inDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function StarRow() {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400" />
      ))}
    </div>
  );
}

export default function PortalLandingPage() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(inDaysIso(2));
  const [guests, setGuests] = useState(2);
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomTypes, setRoomTypes] = useState<PortalRoomType[]>([]);

  useEffect(() => {
    fetchPortalRoomTypes()
      .then((res) => setRoomTypes(res.data.data ?? []))
      .catch(() => setRoomTypes([]));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
      ...(roomTypeId ? { roomTypeId } : {}),
    });
    navigate(`/portal/booking?${params.toString()}`);
  }

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100"
          >
            <Sparkles className="h-3.5 w-3.5" /> Smart Hospitality
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-4xl font-bold leading-tight text-white sm:text-5xl"
          >
            Experience Luxury, Comfort &<br /> Smart Hospitality
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-4 max-w-xl text-sm leading-6 text-cyan-50/80"
          >
            Book your stay, manage reservations, check in online, and access hotel services from one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Link
              to="/portal/booking"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300"
            >
              <BedDouble className="h-4 w-4" /> Book Now
            </Link>
            <Link
              to="/portal/reservations"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <CalendarDays className="h-4 w-4" /> Guest Portal
            </Link>
            <Link
              to="/portal/concierge"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <MessageCircle className="h-4 w-4" /> Contact Us
            </Link>
          </motion.div>
        </div>

        {/* BOOKING WIDGET */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-2xl shadow-slate-950/30 backdrop-blur"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Quick booking</p>
          <h2 className="mt-1 text-xl font-bold">Find your perfect stay</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
                minDate={todayIso()}
                layout="stack"
              />
            </div>
            <label className="col-span-2 sm:col-span-1">
              <span className="text-xs font-medium text-slate-600">Guests</span>
              <input type="number" min={1} max={8} value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
            </label>
            <label className="col-span-2 sm:col-span-1">
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
          </div>
          <button type="submit"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Search className="h-4 w-4" /> Search availability
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Currency: KES · Real-time availability · No booking fees
          </p>
        </motion.form>
      </section>

      {/* FEATURED ROOMS */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Stay in style</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Featured Rooms</h2>
          </div>
          <Link to="/portal/booking" className="text-xs font-semibold text-cyan-200 hover:text-white">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roomTypes.length === 0 && (
            <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-cyan-50/70">
              Loading room types…
            </div>
          )}
          {roomTypes.map((rt) => (
            <article key={rt.id}
              className="overflow-hidden rounded-2xl border border-white/14 bg-white/92 text-slate-900 shadow-xl shadow-slate-950/20 backdrop-blur-xl transition hover:-translate-y-0.5">
              <div className="h-36 bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800" />
              <div className="p-4">
                <h3 className="text-base font-bold">{rt.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{rt.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {rt.amenities?.slice(0, 3).map((a) => (
                    <span key={a} className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700">{a}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold text-slate-900">KES {Number(rt.base_price).toLocaleString()}<span className="text-xs font-normal text-slate-500"> / night</span></p>
                  <Link to={`/portal/booking?roomTypeId=${rt.id}`} className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">Book</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Curated for you</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Experiences & Packages</h2>
            <p className="mt-1 text-sm text-cyan-50/75">Hand-picked stays for every kind of trip — couples, families, business, and weekend escapes.</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-cyan-100 backdrop-blur">
            {PACKAGES.length} packages
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map(({ slug, title, tagline, hero, priceFrom, priceUnit, rating, reviews, accent, short, icon: Icon }) => (
            <Link
              key={slug}
              to={`/portal/packages/${slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/14 bg-white/95 text-slate-900 shadow-xl shadow-slate-950/25 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={hero}
                  alt={title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/0 to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-900 shadow">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating} · {reviews}
                </span>
                <span className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">{tagline}</p>
                <h3 className="mt-1 text-base font-bold leading-snug">{title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{short}</p>
                <div className="mt-auto flex items-end justify-between pt-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</p>
                    <p className="text-lg font-bold text-slate-900">KES {priceFrom.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">{priceUnit}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-cyan-600">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">Loved by guests</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Guest Reviews</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { name: 'Sarah M.',     source: 'Google',     quote: 'Effortless booking, warm staff, and a digital key that actually worked on the first tap.' },
            { name: 'David K.',     source: 'TripAdvisor', quote: 'The concierge arranged a last-minute tour for us. Truly a five-star experience.' },
            { name: 'Linda A.',     source: 'Booking.com', quote: 'Rooms are spotless. Loved the loyalty perks — we will definitely return.' },
          ].map((r) => (
            <figure key={r.name} className="rounded-2xl border border-white/14 bg-white/92 p-5 text-slate-900 shadow-xl">
              <StarRow />
              <blockquote className="mt-2 text-sm leading-6 text-slate-700">“{r.quote}”</blockquote>
              <figcaption className="mt-3 text-xs font-semibold text-slate-500">{r.name} <span className="text-slate-400">· {r.source}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* SERVICE TEASERS */}
      <section>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/80">All in one place</p>
          <h2 className="mt-1 text-2xl font-bold text-white">More from the Guest Portal</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ to, label, desc, Icon }) => (
            <Link key={to} to={to}
              className="group rounded-2xl border border-white/14 bg-slate-950/55 p-4 text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/40">
              <Icon className="h-5 w-5 text-cyan-200" />
              <p className="mt-2 text-sm font-bold">{label}</p>
              <p className="mt-1 text-xs leading-5 text-cyan-50/70">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

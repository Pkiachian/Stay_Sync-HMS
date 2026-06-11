import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

import hotel1 from '@/assets/hotel-1.jpg';
import hotel2 from '@/assets/hotel-2.jpg';
import hotel3 from '@/assets/hotel-3.jpg';
import hotel4 from '@/assets/hotel-4.jpg';
import hotel5 from '@/assets/hotel-5.jpg';
import honeymoon from '@/assets/honeymoon-package.jpg';

type Package = {
  slug: string;
  title: string;
  tagline: string;
  hero: string;
  gallery: string[];
  priceFrom: number;
  priceUnit: string;
  duration: string;
  guests: string;
  rating: number;
  reviews: number;
  accent: string;
  short: string;
  description: string;
  highlights: string[];
  inclusions: string[];
  schedule: { time: string; label: string }[];
  icon: typeof Sparkles;
};

export const PACKAGES: Package[] = [
  {
    slug: 'honeymoon',
    title: 'Honeymoon Package',
    tagline: 'Romance, uninterrupted',
    hero: honeymoon,
    gallery: [honeymoon, hotel4, hotel2, hotel1],
    priceFrom: 38500,
    priceUnit: 'per couple / 2 nights',
    duration: '2 nights',
    guests: '2 adults',
    rating: 4.9,
    reviews: 184,
    accent: 'from-pink-500 to-rose-600',
    short: 'Couples spa, candlelit dinner, late checkout, and a welcome bottle of wine.',
    description:
      'Designed for newlyweds and celebrating couples, our Honeymoon Package weaves together the small, deliberate touches that turn a stay into a milestone. From a chilled welcome bottle waiting in your suite to a private candlelit dinner on the rooftop, every moment is choreographed for two.',
    highlights: [
      'Private rooftop dinner with a dedicated sommelier',
      '60-minute couples spa treatment in our wellness suite',
      'Suite upgrade (subject to availability) and floral arrangement on arrival',
    ],
    inclusions: [
      'Welcome bottle of sparkling wine and artisan chocolates',
      'Daily breakfast for two, served in-room or at the restaurant',
      'One 60-minute couples massage',
      'Candlelit three-course dinner on the rooftop (one evening)',
      'Late checkout until 4:00 PM',
      'Complimentary room fragrance and pillow menu selection',
    ],
    schedule: [
      { time: 'Day 1 · 3:00 PM', label: 'Private check-in with a welcome drink' },
      { time: 'Day 1 · 7:30 PM', label: 'Candlelit rooftop dinner under the stars' },
      { time: 'Day 2 · 10:00 AM', label: 'Breakfast in bed or at the restaurant' },
      { time: 'Day 2 · 2:00 PM', label: 'Couples spa & wellness session' },
      { time: 'Day 2 · 4:00 PM', label: 'Late checkout, no rush' },
    ],
    icon: Sparkles,
  },
  {
    slug: 'family',
    title: 'Family Vacation',
    tagline: 'Big rooms, small worries',
    hero: hotel1,
    gallery: [hotel1, hotel2, hotel3, hotel5],
    priceFrom: 42000,
    priceUnit: 'per family / 3 nights',
    duration: '3 nights',
    guests: '2 adults + 2 kids',
    rating: 4.8,
    reviews: 312,
    accent: 'from-amber-500 to-orange-600',
    short: 'Connecting rooms, kids eat free, and complimentary airport transfers.',
    description:
      'A package built around the way families actually travel — tired kids, hungry teenagers, and parents who still want a little grown-up time. We handle the airport run, set up connecting rooms before you arrive, and keep the kids fed and entertained so the whole family can exhale.',
    highlights: [
      'Two connecting rooms pre-arranged before check-in',
      'Kids eat free at all hotel restaurants (ages 0–12)',
      'Round-trip airport transfer in a family SUV',
    ],
    inclusions: [
      'Round-trip airport transfers (Nairobi area)',
      'Two interconnecting deluxe rooms',
      'Daily breakfast for the whole family',
      'Kids eat free at lunch and dinner',
      'Welcome gift bag for children (ages 0–12)',
      'Access to the kids club and family pool',
      'One complimentary babysitting hour',
    ],
    schedule: [
      { time: 'Day 1 · Anytime', label: 'Airport pickup and family SUV transfer' },
      { time: 'Day 1 · 4:00 PM',  label: 'Connecting rooms ready, kids gift bag waiting' },
      { time: 'Day 2 · Morning',  label: 'Family breakfast and kids club drop-off' },
      { time: 'Day 2 · Evening',  label: 'Pizza & movie night, in-room dining' },
      { time: 'Day 3 · 11:00 AM', label: 'Late family checkout, souvenirs on us' },
    ],
    icon: Users,
  },
  {
    slug: 'business',
    title: 'Business Traveler',
    tagline: 'Work sharp, rest deeper',
    hero: hotel5,
    gallery: [hotel5, hotel2, hotel1, hotel4],
    priceFrom: 22500,
    priceUnit: 'per guest / night',
    duration: '1+ nights',
    guests: '1 adult',
    rating: 4.7,
    reviews: 528,
    accent: 'from-sky-500 to-indigo-600',
    short: 'Express check-in, meeting room access, high-speed WiFi, and laundry.',
    description:
      "Built for the trip where every hour counts. Skip the front desk with mobile check-in, print from the in-room desk, hold a quick meeting in our 24-hour boardroom, and have shirts laundered overnight. You arrive, you work, you check out — without the friction.",
    highlights: [
      'Mobile check-in and digital key, skip the front desk',
      '24-hour access to the executive boardroom (2 hours included)',
      'Same-day laundry and pressing, ready by morning',
    ],
    inclusions: [
      'Express mobile check-in and digital room key',
      'Premium 200 Mbps WiFi, wired backup at the desk',
      'Daily breakfast and on-demand coffee service',
      '2 hours of boardroom access per stay',
      'Same-day laundry and pressing (2 pieces)',
      'Late checkout until 2:00 PM (subject to availability)',
      'Complimentary airport transfer on stays of 3+ nights',
    ],
    schedule: [
      { time: 'Anytime',         label: 'Mobile check-in, key on your phone' },
      { time: 'Morning',         label: 'Breakfast and express coffee to your room' },
      { time: 'Midday',          label: 'Boardroom slot, wired network ready' },
      { time: 'Evening',         label: 'Laundry returned, room reset for the night' },
    ],
    icon: CreditCard,
  },
  {
    slug: 'weekend',
    title: 'Weekend Getaway',
    tagline: 'Two nights, zero inbox',
    hero: hotel2,
    gallery: [hotel2, hotel4, hotel3, hotel1],
    priceFrom: 28000,
    priceUnit: 'per couple / 2 nights',
    duration: '2 nights',
    guests: '2 adults',
    rating: 4.8,
    reviews: 246,
    accent: 'from-emerald-500 to-teal-600',
    short: 'Two nights with breakfast, late Sunday checkout, and rooftop access.',
    description:
      'For the Friday-night arrival that turns into a Sunday reset. Two nights, breakfast both mornings, a late checkout so you can linger over coffee, and full access to the rooftop pool and lounge. Bring a book, leave the laptop at home.',
    highlights: [
      'Late Sunday checkout until 5:00 PM',
      'Full access to rooftop pool, lounge, and bar',
      'Complimentary welcome cocktail for two',
    ],
    inclusions: [
      'Two nights in a deluxe room with city view',
      'Daily breakfast for two',
      'Welcome cocktail each at the rooftop bar',
      'Late checkout until 5:00 PM on Sunday',
      'Rooftop pool and lounge access throughout your stay',
      '20% off spa treatments booked during your stay',
    ],
    schedule: [
      { time: 'Friday · 4:00 PM',   label: 'Check in, welcome cocktail at the rooftop' },
      { time: 'Saturday · Morning', label: 'Sleep in, late breakfast by the pool' },
      { time: 'Saturday · Evening', label: 'Spa session (discounted), dinner in the city' },
      { time: 'Sunday · 5:00 PM',   label: 'Late checkout — coffee, no rush' },
    ],
    icon: CalendarDays,
  },
];

export function getPackageBySlug(slug: string): Package | undefined {
  return PACKAGES.find((p) => p.slug === slug);
}

export default function PackageDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const pkg = slug ? getPackageBySlug(slug) : undefined;

  if (!pkg) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/14 bg-white/95 p-8 text-center text-slate-900 shadow-2xl">
        <h1 className="text-2xl font-bold">Package not found</h1>
        <p className="mt-2 text-sm text-slate-600">The package you are looking for does not exist or has been retired.</p>
        <Link to="/portal" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
          <ArrowLeft className="h-4 w-4" /> Back to portal
        </Link>
      </div>
    );
  }

  const Icon = pkg.icon;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/14 bg-slate-900/60 shadow-2xl shadow-slate-950/40"
      >
        <div className="relative h-72 sm:h-96">
          <img src={pkg.hero} alt={pkg.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-100">
            <Link to="/portal" className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur transition hover:bg-white/20">
              <ArrowLeft className="h-3.5 w-3.5" /> All packages
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {pkg.rating} ({pkg.reviews} reviews)
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{pkg.title}</h1>
          <p className="mt-1 text-base text-cyan-100/85 sm:text-lg">{pkg.tagline}</p>
        </div>
      </motion.section>

      {/* SUMMARY CARDS */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">From</p>
          <p className="mt-1 text-xl font-bold">KES {pkg.priceFrom.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">{pkg.priceUnit}</p>
        </div>
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Duration</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold">
            <Clock className="h-4 w-4 text-slate-500" /> {pkg.duration}
          </p>
        </div>
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Guests</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold">
            <Users className="h-4 w-4 text-slate-500" /> {pkg.guests}
          </p>
        </div>
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Theme</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${pkg.accent} text-white`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            {pkg.tagline}
          </p>
        </div>
      </motion.section>

      {/* DESCRIPTION + HIGHLIGHTS */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"
      >
        <article className="rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl">
          <h2 className="text-lg font-bold">About this package</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{pkg.description}</p>

          <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Highlights</h3>
          <ul className="mt-2 space-y-2">
            {pkg.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-slate-700">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">What's included</h3>
          <ul className="mt-3 space-y-2">
            {pkg.inclusions.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3 w-3" />
                </span>
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </aside>
      </motion.section>

      {/* GALLERY */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="mb-3 text-lg font-bold text-white">A look inside</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pkg.gallery.map((img, i) => (
            <figure
              key={i}
              className={`overflow-hidden rounded-2xl border border-white/14 shadow-lg ${
                i === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-square' : 'aspect-[4/3]'
              }`}
            >
              <img
                src={img}
                alt={`${pkg.title} photo ${i + 1}`}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </figure>
          ))}
        </div>
      </motion.section>

      {/* SCHEDULE */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl"
      >
        <h2 className="text-lg font-bold">Sample itinerary</h2>
        <p className="mt-1 text-xs text-slate-500">A typical flow — your concierge will tailor it to your arrival time.</p>
        <ol className="mt-4 space-y-3">
          {pkg.schedule.map((s, i) => (
            <li key={s.label} className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${pkg.accent} text-xs font-bold text-white`}>
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.time}</p>
                <p className="text-sm font-medium text-slate-800">{s.label}</p>
              </div>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-3 rounded-3xl border border-white/14 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-8 text-center text-white shadow-2xl backdrop-blur"
      >
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to book {pkg.title}?</h2>
        <p className="max-w-xl text-sm text-cyan-50/80">
          Reserve in minutes with our quick booking widget, or chat with our AI concierge to tailor the package to your dates.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/portal/booking"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-400 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300"
          >
            <CalendarDays className="h-4 w-4" /> Book this package
          </Link>
          <Link
            to="/portal/chat"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Sparkles className="h-4 w-4" /> Ask the concierge
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

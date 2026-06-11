import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Hotel,
  Sparkles,
  Star,
  Users,
  Wifi,
} from 'lucide-react';

import roomStandardKing  from '@/assets/room-standard-king.webp';
import roomDeluxeKing    from '@/assets/room-deluxe-king.jpeg';
import roomDeluxeTwin    from '@/assets/room-deluxe-twin.jpeg';
import roomSuite         from '@/assets/room-suite.jpeg';
import roomPenthouse     from '@/assets/room-penthouse.avif';
import hotel1            from '@/assets/hotel-1.jpg';
import hotel2            from '@/assets/hotel-2.jpg';
import hotel3            from '@/assets/hotel-3.jpg';
import hotel4            from '@/assets/hotel-4.jpg';
import hotel5            from '@/assets/hotel-5.jpg';

type RoomTypeDetail = {
  slug: string;
  matchName: string;
  name: string;
  tagline: string;
  hero: string;
  gallery: string[];
  basePrice: number;
  maxOccupancy: number;
  bed: string;
  size: string;
  view: string;
  rating: number;
  reviews: number;
  accent: string;
  description: string;
  amenities: { Icon: typeof Wifi; label: string }[];
  inclusions: string[];
};

const ROOM_TYPES: RoomTypeDetail[] = [
  {
    slug: 'standard-king',
    matchName: 'Standard King',
    name: 'Standard King',
    tagline: 'City comfort, every night',
    hero: roomStandardKing,
    gallery: [roomStandardKing, hotel2, hotel4, hotel1],
    basePrice: 8000,
    maxOccupancy: 2,
    bed: '1 King bed',
    size: '32 m²',
    view: 'City view',
    rating: 4.6,
    reviews: 412,
    accent: 'from-cyan-500 to-blue-700',
    description:
      'A calm, well-appointed retreat for solo travelers and couples. Soft linens, blackout curtains, fast WiFi, and a rainfall shower make this our most-booked room for short business trips and weekend city breaks.',
    amenities: [
      { Icon: Wifi,    label: 'Free high-speed WiFi' },
      { Icon: Hotel,   label: '32 m² room with city view' },
      { Icon: Users,   label: 'Sleeps 2 adults' },
    ],
    inclusions: [
      'Daily housekeeping and turn-down service',
      'Complimentary bottled water and in-room coffee',
      'Smart TV with streaming apps',
      'Rainfall shower with branded toiletries',
      'In-room safe and blackout curtains',
      '24-hour room service',
    ],
  },
  {
    slug: 'deluxe-king',
    matchName: 'Deluxe King',
    name: 'Deluxe King',
    tagline: 'A little more room to breathe',
    hero: roomDeluxeKing,
    gallery: [roomDeluxeKing, hotel3, hotel2, hotel5],
    basePrice: 12000,
    maxOccupancy: 2,
    bed: '1 King bed',
    size: '42 m²',
    view: 'Garden or city view',
    rating: 4.7,
    reviews: 358,
    accent: 'from-violet-500 to-indigo-700',
    description:
      'More space, a seating corner, and a private balcony in most units. The Deluxe King is the right step up for honeymoons, anniversary trips, and guests who simply want to spread out.',
    amenities: [
      { Icon: Wifi,    label: 'Free high-speed WiFi' },
      { Icon: Hotel,   label: '42 m² with private balcony' },
      { Icon: Users,   label: 'Sleeps 2 adults' },
    ],
    inclusions: [
      'Private balcony with seating for two',
      'Mini-bar with complimentary soft drinks',
      'Premium toiletries and bathrobes',
      'Nespresso machine with daily capsules',
      'Daily housekeeping and turn-down service',
      'Late checkout until 1:00 PM (subject to availability)',
    ],
  },
  {
    slug: 'deluxe-twin',
    matchName: 'Deluxe Twin',
    name: 'Deluxe Twin',
    tagline: 'For colleagues, friends, and siblings',
    hero: roomDeluxeTwin,
    gallery: [roomDeluxeTwin, hotel1, hotel4, hotel2],
    basePrice: 12000,
    maxOccupancy: 2,
    bed: '2 Single beds',
    size: '42 m²',
    view: 'City view',
    rating: 4.6,
    reviews: 226,
    accent: 'from-amber-500 to-orange-600',
    description:
      'Two proper single beds in a generously sized room with a work desk and lounge chair. Ideal for colleagues on a project, friends traveling together, or siblings visiting family who do not want to share a bed.',
    amenities: [
      { Icon: Wifi,    label: 'Free high-speed WiFi' },
      { Icon: Hotel,   label: '42 m² with work desk' },
      { Icon: Users,   label: 'Sleeps 2 adults' },
    ],
    inclusions: [
      'Two single beds with premium linens',
      'Dedicated work desk with ergonomic chair',
      'Mini-bar with complimentary soft drinks',
      'Smart TV with streaming apps',
      'Daily housekeeping',
      'Complimentary pressing for one shirt per stay',
    ],
  },
  {
    slug: 'suite',
    matchName: 'Suite',
    name: 'Suite',
    tagline: 'A living room of your own',
    hero: roomSuite,
    gallery: [roomSuite, hotel3, hotel5, hotel4],
    basePrice: 18000,
    maxOccupancy: 3,
    bed: '1 King + sofa bed',
    size: '62 m²',
    view: 'Panoramic city view',
    rating: 4.8,
    reviews: 198,
    accent: 'from-rose-500 to-pink-700',
    description:
      'A separate living room, a king bedroom, and a marble bathroom with a deep soaking tub. Perfect for small families (the sofa bed sleeps one child) and for guests who want a lounge to host informal meetings.',
    amenities: [
      { Icon: Wifi,    label: 'Free high-speed WiFi' },
      { Icon: Hotel,   label: '62 m² two-room suite' },
      { Icon: Users,   label: 'Sleeps 2 adults + 1 child' },
    ],
    inclusions: [
      'Separate living room with sofa bed',
      'Marble bathroom with soaking tub and rainfall shower',
      'Welcome fruit basket and sparkling wine',
      'Nespresso machine and curated mini-bar',
      'Two TVs (living room and bedroom)',
      'Daily housekeeping and turn-down service',
    ],
  },
  {
    slug: 'penthouse',
    matchName: 'Penthouse',
    name: 'Penthouse',
    tagline: 'The whole top floor, just for you',
    hero: roomPenthouse,
    gallery: [roomPenthouse, hotel5, hotel3, hotel2],
    basePrice: 30000,
    maxOccupancy: 4,
    bed: '1 King + 2 Single',
    size: '120 m²',
    view: 'Panoramic 360° view',
    rating: 4.9,
    reviews: 84,
    accent: 'from-amber-400 to-yellow-600',
    description:
      'The top floor, all of it. Two bedrooms, a private terrace with a Jacuzzi, a butler on call, and the best view in the house. For honeymoons, milestone celebrations, and guests who want to feel like the only people in the building.',
    amenities: [
      { Icon: Wifi,    label: 'Free high-speed WiFi' },
      { Icon: Hotel,   label: '120 m² with private terrace' },
      { Icon: Users,   label: 'Sleeps 4 adults' },
    ],
    inclusions: [
      'Private terrace with Jacuzzi and lounge',
      'Two bedrooms, two marble bathrooms',
      'Dedicated butler throughout your stay',
      'Chilled champagne and floral arrangement on arrival',
      'Daily breakfast for the whole party',
      'One complimentary airport transfer each way',
    ],
  },
];

export function getRoomTypeBySlug(slug: string): RoomTypeDetail | undefined {
  return ROOM_TYPES.find((r) => r.slug === slug);
}

export function getRoomTypeImage(name: string): string | undefined {
  return ROOM_TYPES.find((r) => r.matchName === name)?.hero;
}

export default function RoomTypeDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const rt = slug ? getRoomTypeBySlug(slug) : undefined;

  if (!rt) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/14 bg-white/95 p-8 text-center text-slate-900 shadow-2xl">
        <h1 className="text-2xl font-bold">Room type not found</h1>
        <p className="mt-2 text-sm text-slate-600">The room you are looking for is no longer available.</p>
        <Link to="/portal" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
          <ArrowLeft className="h-4 w-4" /> Back to portal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/14 bg-slate-900/60 shadow-2xl shadow-slate-950/40"
      >
        <div className="relative h-72 sm:h-96">
          <img src={rt.hero} alt={rt.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-100">
            <Link to="/portal" className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur transition hover:bg-white/20">
              <ArrowLeft className="h-3.5 w-3.5" /> All rooms
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {rt.rating} ({rt.reviews} reviews)
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{rt.name}</h1>
          <p className="mt-1 text-base text-cyan-100/85 sm:text-lg">{rt.tagline}</p>
        </div>
      </motion.section>

      {/* QUICK STATS */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-3 sm:grid-cols-4"
      >
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">From</p>
          <p className="mt-1 text-xl font-bold">KES {rt.basePrice.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">per night</p>
        </div>
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bed</p>
          <p className="mt-1 text-base font-bold">{rt.bed}</p>
        </div>
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Size</p>
          <p className="mt-1 text-base font-bold">{rt.size}</p>
        </div>
        <div className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-lg">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">View</p>
          <p className="mt-1 text-base font-bold">{rt.view}</p>
        </div>
      </motion.section>

      {/* DESCRIPTION + INCLUSIONS */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"
      >
        <article className="rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl">
          <h2 className="text-lg font-bold">About this room</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{rt.description}</p>

          <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">At a glance</h3>
          <ul className="mt-2 space-y-2">
            {rt.amenities.map(({ Icon, label }) => (
              <li key={label} className="flex items-start gap-2 text-sm text-slate-700">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </article>

        <aside className="rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">What's included</h3>
          <ul className="mt-3 space-y-2">
            {rt.inclusions.map((i) => (
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
        <h2 className="mb-3 text-lg font-bold text-white">Inside this room</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rt.gallery.map((img, i) => (
            <figure
              key={i}
              className={`overflow-hidden rounded-2xl border border-white/14 shadow-lg ${
                i === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-square' : 'aspect-[4/3]'
              }`}
            >
              <img
                src={img}
                alt={`${rt.name} photo ${i + 1}`}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </figure>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-3 rounded-3xl border border-white/14 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-8 text-center text-white shadow-2xl backdrop-blur"
      >
        <h2 className="text-2xl font-bold sm:text-3xl">Reserve a {rt.name}</h2>
        <p className="max-w-xl text-sm text-cyan-50/80">
          Pick your dates and we will show you the exact rooms available for this category. From {` `}
          <span className="font-semibold text-white">KES {rt.basePrice.toLocaleString()}</span> per night.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/portal/booking?roomTypeId=${encodeURIComponent(rt.matchName)}`}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-400 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300"
          >
            <CalendarDays className="h-4 w-4" /> Book this room
          </Link>
          <Link
            to="/portal/chat"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Sparkles className="h-4 w-4" /> Ask the concierge
          </Link>
        </div>
        <Link to="/portal" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-100/80 hover:text-white">
          Back to all rooms <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.section>
    </div>
  );
}

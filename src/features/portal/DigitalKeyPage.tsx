import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, Hash, Lock, Nfc, QrCode, Search, Smartphone, Unlock, User, Wifi } from 'lucide-react';
import { lookupPortalBooking, type PortalBooking } from '@/lib/portalApi';

type Method = 'mobile' | 'qr' | 'nfc' | 'bluetooth';

const TABS: { key: Method; label: string; Icon: typeof Smartphone }[] = [
  { key: 'mobile',    label: 'Mobile',    Icon: Smartphone },
  { key: 'qr',        label: 'QR code',   Icon: QrCode },
  { key: 'nfc',       label: 'NFC',       Icon: Nfc },
  { key: 'bluetooth', label: 'Bluetooth', Icon: Bluetooth },
];

export default function PortalDigitalKeyPage() {
  const [reference, setReference] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [booking,   setBooking]   = useState<PortalBooking | null>(null);
  const [error,     setError]     = useState('');
  const [unlocked,  setUnlocked]  = useState(false);
  const [method,    setMethod]    = useState<Method>('mobile');
  const [busy,      setBusy]      = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!reference.trim() || !lastName.trim()) {
      setError('Please enter your reference and last name.');
      return;
    }
    try {
      const res = await lookupPortalBooking({ reference: reference.trim(), lastName: lastName.trim() });
      setBooking(res.data.data.booking ?? null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'No booking found for those details.');
    }
  }

  function handleUnlock() {
    if (unlocked) {
      setUnlocked(false);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setUnlocked(true);
      setBusy(false);
    }, 900);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">No keycard needed</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Digital Room Key</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Use your phone to unlock the door. Choose any method that suits your device.</p>
      </header>

      {!booking ? (
        <form onSubmit={handleLookup} className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
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
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
              </div>
            </label>
            <button type="submit" className="mt-[22px] inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500">
              <Search className="h-4 w-4" /> Continue
            </button>
          </div>
          {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
        </form>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Your room</h2>
            <p className="mt-2 text-3xl font-bold tracking-widest text-cyan-700">#{booking.room?.room_number}</p>
            <p className="text-xs text-slate-500">{(booking.room?.room_type ?? booking.room?.roomType)?.name} · Floor {booking.room?.floor}</p>
            <p className="mt-2 text-xs text-slate-500">Booking {booking.booking_reference}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {TABS.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setMethod(key)} type="button"
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${method === key ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/14 bg-slate-950/55 p-6 text-center text-white shadow-2xl backdrop-blur">
            <AnimatePresence mode="wait">
              {!unlocked ? (
                <motion.div key="locked" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <motion.button onClick={handleUnlock} disabled={busy}
                    whileTap={{ scale: 0.96 }}
                    className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 shadow-2xl shadow-cyan-500/30 disabled:opacity-70">
                    {busy ? (
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
                    ) : (
                      <Lock className="h-12 w-12 text-white" />
                    )}
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-cyan-400/30" />
                  </motion.button>
                  <p className="mt-4 text-sm text-cyan-50/80">Tap to unlock door with <span className="font-semibold text-cyan-100">{TABS.find((t) => t.key === method)?.label}</span></p>
                  <p className="mt-1 text-xs text-cyan-100/60">Demo unlock — production connects to your room's smart lock.</p>
                </motion.div>
              ) : (
                <motion.div key="unlocked" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 shadow-2xl shadow-emerald-500/30">
                    <Unlock className="h-12 w-12 text-white" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-emerald-200">Door unlocked</p>
                  <p className="mt-1 text-xs text-cyan-100/60">Enjoy your stay at StaySync.</p>
                  <button onClick={() => setUnlocked(false)} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-cyan-100 hover:bg-white/20">
                    <Lock className="h-3.5 w-3.5" /> Lock again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <MethodVisual method={method} />
          </div>
        </div>
      )}
    </div>
  );
}

function MethodVisual({ method }: { method: Method }) {
  if (method === 'qr') {
    return (
      <div className="mt-6 flex justify-center">
        <div className="rounded-2xl bg-white p-3">
          <div className="grid h-28 w-28 grid-cols-6 grid-rows-6 gap-0.5">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className={`rounded-sm ${((i * 7 + 3) % 5 < 3) ? 'bg-slate-900' : 'bg-white'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (method === 'nfc') {
    return (
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
        <Nfc className="h-3.5 w-3.5" /> Hold phone near the lock reader
      </div>
    );
  }
  if (method === 'bluetooth') {
    return (
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
        <Bluetooth className="h-3.5 w-3.5" /> Bluetooth range · 2 m
      </div>
    );
  }
  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
      <Wifi className="h-3.5 w-3.5" /> Wi-Fi fallback active
    </div>
  );
}

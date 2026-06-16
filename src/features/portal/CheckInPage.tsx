import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  FileSignature,
  Hash,
  IdCard,
  Search,
  User,
} from 'lucide-react';
import { lookupPortalBooking, type PortalBooking } from '@/lib/portalApi';

type Step = 'lookup' | 'id' | 'confirm' | 'done';

export default function PortalCheckInPage() {
  const [step, setStep] = useState<Step>('lookup');
  const [reference, setReference] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [booking,   setBooking]   = useState<PortalBooking | null>(null);
  const [error,     setError]     = useState('');
  const [idFile,    setIdFile]    = useState<string>('');
  const [signature, setSignature] = useState('');
  const [arrival,   setArrival]   = useState('14:00');

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
      setStep('id');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'No booking found for those details.');
    }
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (signature.trim().length < 2) return;
    setStep('done');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Skip the front desk</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Online Check-in</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Complete these three quick steps before you arrive so your room is ready when you are.</p>
      </header>

      <Stepper step={step} />

      <AnimatePresence mode="wait">
        {step === 'lookup' && (
          <motion.form key="lookup" onSubmit={handleLookup} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">1 · Find your booking</h2>
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
            {error && <p className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"><AlertCircle className="h-3.5 w-3.5" /> {error}</p>}
          </motion.form>
        )}

        {step === 'id' && booking && (
          <motion.div key="id" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-4">
            <div className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Booking verified</h2>
              <p className="mt-1 text-lg font-bold">{booking.guest?.first_name} {booking.guest?.last_name}</p>
              <p className="text-xs text-slate-500">{booking.booking_reference} · {booking.check_in_date} → {booking.check_out_date}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setStep('confirm'); }} className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">2 · Upload your ID</h2>
              <p className="mt-1 text-xs text-slate-500">A clear photo of your passport, national ID, or driver's license is fine. (Demo: file is not actually uploaded.)</p>
              <label className="mt-3 flex h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-cyan-400">
                <IdCard className="h-6 w-6 text-slate-500" />
                <span className="mt-1 text-xs font-medium text-slate-600">{idFile || 'Click to select a file'}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={(e) => setIdFile(e.target.files?.[0]?.name ?? '')} />
              </label>
              <div className="mt-4 flex justify-between">
                <button type="button" onClick={() => setStep('lookup')} className="text-xs font-medium text-slate-500 hover:text-slate-800">Back</button>
                <button type="submit" disabled={!idFile} className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">Continue</button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'confirm' && booking && (
          <motion.form key="confirm" onSubmit={handleConfirm} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-4">
            <div className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">3 · Sign registration & arrival time</h2>
              <p className="mt-1 text-xs text-slate-500">By typing your full name, you agree to our standard guest registration terms.</p>

              <label className="mt-4 block">
                <span className="text-xs font-medium text-slate-600">Signature (type your full name)</span>
                <div className="relative mt-1">
                  <FileSignature className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Your full name"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 font-serif italic focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200" />
                </div>
              </label>

              <label className="mt-3 block">
                <span className="text-xs font-medium text-slate-600">Expected arrival time</span>
                <select value={arrival} onChange={(e) => setArrival(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200">
                  {['12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <div className="mt-4 flex justify-between">
                <button type="button" onClick={() => setStep('id')} className="text-xs font-medium text-slate-500 hover:text-slate-800">Back</button>
                <button type="submit" disabled={signature.trim().length < 2} className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">
                  Complete check-in
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-200 bg-white/95 p-6 text-center text-slate-900 shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-xl font-bold">You're all set</h2>
            <p className="mt-1 text-sm text-slate-500">Your room will be ready by {arrival}. Pick up your digital key on arrival, or use the link below right now.</p>
            <a href="/portal/key" className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500">Open digital key</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'lookup',  label: 'Find booking' },
  { key: 'id',      label: 'Upload ID' },
  { key: 'confirm', label: 'Sign & arrival' },
  { key: 'done',    label: 'Done' },
];

function Stepper({ step }: { step: Step }) {
  const idx = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="grid grid-cols-4 gap-2 text-center">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.key} className={`rounded-xl border p-2 text-xs font-medium ${active ? 'border-cyan-300 bg-cyan-400/10 text-cyan-100' : done ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-white/5 text-cyan-50/60'}`}>
            <span className="block text-[10px] uppercase tracking-wide">Step {i + 1}</span>
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}

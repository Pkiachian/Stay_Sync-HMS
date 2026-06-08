import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlarmClock,
  Car,
  CheckCircle2,
  Clock,
  ConciergeBell,
  Filter,
  Hotel,
  Loader2,
  MapPin,
  MessageCircle,
  Plane,
  RefreshCw,
  Search,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

type ServiceType = 'taxi' | 'airport' | 'wakeup' | 'laundry' | 'housekeeping' | 'tour' | 'chat_handoff';
type Status = 'open' | 'in_progress' | 'resolved' | 'cancelled';

type ChatTranscript = Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;

type ServiceRequest = {
  id: number;
  reference: string;
  service_type: ServiceType;
  source: string | null;
  guest_name: string;
  room_number: string | null;
  phone: string | null;
  email: string | null;
  preferred_at: string | null;
  details: string | null;
  transcript: ChatTranscript | null;
  status: Status;
  staff_notes: string | null;
  resolver?: { id: number; name: string } | null;
  resolved_at: string | null;
  created_at: string;
};

const SERVICE_META: Record<ServiceType, { label: string; Icon: typeof Car; accent: string }> = {
  taxi:         { label: 'Taxi',             Icon: Car,           accent: 'from-amber-500 to-orange-600' },
  airport:      { label: 'Airport Transfer', Icon: Plane,         accent: 'from-sky-500 to-indigo-600' },
  wakeup:       { label: 'Wake-up Call',     Icon: AlarmClock,    accent: 'from-violet-500 to-purple-600' },
  laundry:      { label: 'Laundry',          Icon: Shirt,         accent: 'from-rose-500 to-pink-600' },
  housekeeping: { label: 'Housekeeping',     Icon: Sparkles,      accent: 'from-emerald-500 to-teal-600' },
  tour:         { label: 'Tour Booking',     Icon: MapPin,        accent: 'from-cyan-500 to-blue-600' },
  chat_handoff: { label: 'Chat Handoff',     Icon: MessageCircle, accent: 'from-fuchsia-500 to-violet-600' },
};

const STATUS_CONFIG: Record<Status, { label: string; dot: string; chip: string }> = {
  open:        { label: 'Open',        dot: 'bg-rose-500',     chip: 'bg-rose-100 text-rose-700' },
  in_progress: { label: 'In progress', dot: 'bg-amber-500',    chip: 'bg-amber-100 text-amber-700' },
  resolved:    { label: 'Resolved',    dot: 'bg-emerald-500',  chip: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Cancelled',   dot: 'bg-slate-500',    chip: 'bg-slate-100 text-slate-600' },
};

export default function ConciergeInboxPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'all'>('all');
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [staffNotes, setStaffNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ success: boolean; data: ServiceRequest[] }>('/service-requests');
      setRequests(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not load service requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const acc: Record<Status, number> = { open: 0, in_progress: 0, resolved: 0, cancelled: 0 };
    for (const r of requests) acc[r.status] += 1;
    return acc;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => typeFilter === 'all' || r.service_type === typeFilter)
      .filter((r) => {
        if (!q) return true;
        return (
          r.reference.toLowerCase().includes(q) ||
          r.guest_name.toLowerCase().includes(q) ||
          (r.room_number ?? '').toLowerCase().includes(q) ||
          (r.phone ?? '').toLowerCase().includes(q) ||
          (r.details ?? '').toLowerCase().includes(q)
        );
      });
  }, [requests, search, statusFilter, typeFilter]);

  function openDetails(r: ServiceRequest) {
    setSelected(r);
    setStaffNotes(r.staff_notes ?? '');
  }

  async function saveStatus(status: Status) {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.patch<{ success: boolean; data: ServiceRequest }>(`/service-requests/${selected.id}`, {
        status,
        staff_notes: staffNotes.trim() || null,
      });
      const updated = res.data.data;
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not update the request.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Concierge Inbox</h2>
          <p className="text-white/70 text-sm">Guest requests submitted from the public portal</p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/12 px-4 text-sm font-semibold text-white shadow-lg hover:bg-white/20"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['open', 'in_progress', 'resolved', 'cancelled'] as Status[]).map((s) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br relative overflow-hidden',
              s === 'open' && 'from-rose-500 to-rose-700',
              s === 'in_progress' && 'from-amber-500 to-amber-700',
              s === 'resolved' && 'from-emerald-500 to-emerald-700',
              s === 'cancelled' && 'from-slate-500 to-slate-700',
            )}
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />
            <ConciergeBell className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{counts[s]}</p>
            <p className="text-white/80 text-xs mt-0.5">{STATUS_CONFIG[s].label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, guest, room, phone..."
            aria-label="Search concierge requests"
            className="w-full pl-9 pr-9 h-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'open', 'in_progress', 'resolved', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                statusFilter === s ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', ...Object.keys(SERVICE_META)] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as ServiceType | 'all')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                typeFilter === t ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {t === 'all' ? 'All services' : SERVICE_META[t as ServiceType].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && requests.length === 0 ? (
          <div className="col-span-full flex justify-center py-10 text-white/70">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            {requests.length === 0
              ? 'No concierge requests yet.'
              : 'No requests match the current filters.'}
          </div>
        ) : (
          filtered.map((r) => {
            const meta = SERVICE_META[r.service_type];
            const status = STATUS_CONFIG[r.status];
            return (
              <motion.button
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => openDetails(r)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow bg-gradient-to-br', meta.accent)}>
                      <meta.Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{meta.label}</p>
                      <p className="text-xs text-gray-400 truncate">{r.guest_name} · Room {r.room_number ?? '—'}</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', status.chip)}>
                    {status.label}
                  </span>
                </div>

                <p className="text-xs font-mono text-gray-500">{r.reference}</p>
                {r.details && (
                  <p className="mt-2 text-xs text-gray-600 line-clamp-2 italic">"{r.details}"</p>
                )}
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(r.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {r.preferred_at && (
                    <span className="flex items-center gap-1">
                      <Hotel className="w-3 h-3" /> {new Date(r.preferred_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !saving && setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden"
            >
              <div className={cn('p-5 text-white bg-gradient-to-br', SERVICE_META[selected.service_type].accent)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs opacity-80 font-mono">{selected.reference}</span>
                  <button
                    onClick={() => setSelected(null)}
                    disabled={saving}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-bold">{SERVICE_META[selected.service_type].label}</h3>
                <p className="text-white/80 text-sm">{selected.guest_name} · Room {selected.room_number ?? '—'}</p>
              </div>

              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Info label="Phone" value={selected.phone ?? '—'} />
                  <Info label="Email" value={selected.email ?? '—'} />
                  <Info label="Submitted" value={new Date(selected.created_at).toLocaleString()} />
                  <Info label="Preferred time" value={selected.preferred_at ? new Date(selected.preferred_at).toLocaleString() : '—'} />
                </div>

                {selected.details && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Details from guest</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.details}</p>
                  </div>
                )}

                {selected.service_type === 'chat_handoff' && selected.transcript && selected.transcript.length > 0 && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 mb-2">Chat transcript (last {selected.transcript.length})</p>
                    <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                      {selected.transcript.map((m, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                              m.role === 'user' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-200 text-slate-700',
                            )}
                          >
                            {m.role}
                          </span>
                          <p className="text-slate-700 whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 mb-1">Staff notes</p>
                  <textarea
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Driver assigned, ETA 6:30pm"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    disabled={saving}
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Update status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['open', 'in_progress', 'resolved', 'cancelled'] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => void saveStatus(s)}
                        disabled={saving || selected.status === s}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors flex items-center justify-center gap-1',
                          selected.status === s
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50',
                        )}
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : s === 'resolved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {selected.resolver && selected.resolved_at && (
                  <p className="text-[11px] text-slate-500">
                    Resolved by {selected.resolver.name} on {new Date(selected.resolved_at).toLocaleString()}.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-700 break-words">{value}</p>
    </div>
  );
}

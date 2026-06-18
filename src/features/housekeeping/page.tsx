import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BedDouble,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchRoomStatusSummary,
  fetchRooms,
  updateRoomStatus,
  type ApiRoom,
  type RoomStatus,
  type RoomStatusSummary,
} from '@/lib/protectedEndpoints';

type FilterKey = RoomStatus | 'all';

const STATUS_CONFIG: Record<RoomStatus, { label: string; bg: string; text: string; dot: string; Icon: React.ComponentType<{ className?: string }> }> = {
  available:     { label: 'Available',     bg: 'bg-emerald-100', text: 'text-emerald-700', dot: '#10b981', Icon: CheckCircle },
  occupied:      { label: 'Occupied',      bg: 'bg-rose-100',    text: 'text-rose-700',    dot: '#f43f5e', Icon: BedDouble },
  dirty:         { label: 'Dirty',         bg: 'bg-red-100',     text: 'text-red-700',     dot: '#ef4444', Icon: AlertCircle },
  cleaning:      { label: 'Cleaning',      bg: 'bg-amber-100',   text: 'text-amber-700',   dot: '#f59e0b', Icon: RefreshCw },
  clean:         { label: 'Clean',         bg: 'bg-lime-100',    text: 'text-lime-700',    dot: '#84cc16', Icon: Sparkles },
  inspected:     { label: 'Inspected',     bg: 'bg-blue-100',    text: 'text-blue-700',    dot: '#3b82f6', Icon: CheckCircle },
  reserved:      { label: 'Reserved',      bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: '#6366f1', Icon: Clock },
  maintenance:   { label: 'Maintenance',   bg: 'bg-slate-100',   text: 'text-slate-700',   dot: '#64748b', Icon: Wrench },
  out_of_service:{ label: 'Out of service',bg: 'bg-zinc-200',    text: 'text-zinc-700',    dot: '#71717a', Icon: Wrench },
};

// Suggested next-status options shown in the modal, in order. Anything not
// in this list is still allowed via the explicit "Other status" picker.
const WORKFLOW_TRANSITIONS: Array<{ from: RoomStatus; to: RoomStatus; label: string }> = [
  { from: 'dirty',    to: 'cleaning',   label: 'Start cleaning' },
  { from: 'cleaning', to: 'clean',      label: 'Mark clean' },
  { from: 'clean',    to: 'inspected',  label: 'Mark inspected' },
  { from: 'inspected', to: 'available', label: 'Mark ready for sale' },
  { from: 'occupied', to: 'dirty',      label: 'Mark dirty (check-out)' },
  { from: 'reserved', to: 'dirty',      label: 'Mark dirty (cancel/no-show)' },
];

const FILTER_ORDER: FilterKey[] = [
  'all', 'available', 'occupied', 'reserved', 'dirty', 'cleaning', 'clean', 'inspected', 'maintenance', 'out_of_service',
];

function isRoomStatus(value: string): value is RoomStatus {
  return value in STATUS_CONFIG;
}

function asRoomStatus(value: string): RoomStatus {
  return isRoomStatus(value) ? value : 'available';
}

interface SummaryResponse {
  summary: RoomStatusSummary;
  total_rooms: number;
}

function unwrapData<T>(res: { data: unknown }): T {
  const d = res.data as { data?: T } | T;
  if (d && typeof d === 'object' && 'data' in (d as Record<string, unknown>)) {
    return (d as { data: T }).data;
  }
  return d as T;
}

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [summary, setSummary] = useState<RoomStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<ApiRoom | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsRes, summaryRes] = await Promise.all([fetchRooms(), fetchRoomStatusSummary()]);
      setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data.data ?? []));
      const summaryPayload = unwrapData<SummaryResponse>(summaryRes as { data: unknown });
      setSummary(summaryPayload.summary);
    } catch {
      setError('Live housekeeping data unavailable. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((room) => {
      if (statusFilter !== 'all' && room.status !== statusFilter) return false;
      if (!q) return true;
      const type = room.room_type?.name ?? room.roomType?.name ?? '';
      return (
        String(room.room_number).toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        String(room.floor).includes(q)
      );
    });
  }, [rooms, search, statusFilter]);

  const counts = useMemo(() => {
    const fallback = (s: RoomStatus) => rooms.filter((r) => r.status === s).length;
    return {
      dirty: summary?.dirty ?? fallback('dirty'),
      cleaning: summary?.cleaning ?? fallback('cleaning'),
      clean: summary?.clean ?? fallback('clean'),
      inspected: summary?.inspected ?? fallback('inspected'),
    };
  }, [rooms, summary]);

  const transitionsFor = (status: RoomStatus) =>
    WORKFLOW_TRANSITIONS.filter((t) => t.from === status);

  const handleTransition = async (room: ApiRoom, target: RoomStatus) => {
    setUpdating(true);
    setUpdateError(null);
    try {
      const res = await updateRoomStatus(room.id, { status: target, notes: notes.trim() || undefined });
      const updated = unwrapData<ApiRoom>(res as { data: unknown });
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, ...updated } : r)));
      setSelected((prev) => (prev && prev.id === room.id ? { ...prev, ...updated } : prev));
      setNotes('');
      // Recompute the summary in-place so the cards stay accurate without a second round trip.
      setRooms((prev) => {
        const next = prev.map((r) => (r.id === room.id ? { ...r, ...updated } : r));
        setSummary((s) => {
          const base: RoomStatusSummary = s ?? {
            available: 0, occupied: 0, dirty: 0, cleaning: 0, clean: 0, inspected: 0, reserved: 0, maintenance: 0, out_of_service: 0,
          };
          const recomputed: RoomStatusSummary = { ...base };
          for (const r of next) recomputed[asRoomStatus(r.status as string)] = (recomputed[asRoomStatus(r.status as string)] ?? 0) + 1;
          return recomputed;
        });
        return next;
      });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Could not update room status. Please try again.';
      setUpdateError(message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Housekeeping</h2>
          <p className="text-white/70 text-sm">Room readiness across the property</p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'dirty',    label: 'Needs Cleaning', gradient: 'from-red-400 to-red-600',     Icon: AlertCircle },
          { key: 'cleaning', label: 'In Progress',    gradient: 'from-amber-400 to-amber-600', Icon: RefreshCw },
          { key: 'clean',    label: 'Cleaned',        gradient: 'from-lime-400 to-green-600',  Icon: Sparkles },
          { key: 'inspected',label: 'Inspected',      gradient: 'from-blue-400 to-blue-600',   Icon: CheckCircle },
        ].map(({ key, label, gradient, Icon }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br relative overflow-hidden', gradient)}
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />
            <Icon className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{counts[key as 'dirty' | 'cleaning' | 'clean' | 'inspected']}</p>
            <p className="text-white/80 text-xs mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Room Status Grid</h3>
            <p className="text-xs text-gray-400">Click a tile to update its status</p>
          </div>
          <BedDouble className="w-5 h-5 text-blue-500" />
        </div>

        {loading ? (
          <p className="text-xs text-gray-500">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="text-xs text-gray-500">No rooms configured yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
            {filtered.map((room) => {
              const status = asRoomStatus(room.status as string);
              const config = STATUS_CONFIG[status];
              const type = room.room_type?.name ?? room.roomType?.name ?? 'Room';
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => { setSelected(room); setNotes(''); setUpdateError(null); }}
                  className={cn(
                    'rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
                    config.bg, config.text,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">Room {room.room_number}</p>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: config.dot }} />
                  </div>
                  <p className="mt-1 text-xs opacity-75">{type}</p>
                  <p className="mt-2 text-xs font-semibold flex items-center gap-1.5">
                    <config.Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </p>
                </button>
              );
            })}
          </div>
        )}
        {!loading && rooms.length > 0 && filtered.length === 0 && (
          <p className="mt-3 text-xs text-gray-500">No rooms match the current filter.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search room number, type, or floor..."
            aria-label="Search rooms"
            className="w-full pl-9 pr-9 h-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {FILTER_ORDER.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors',
                statusFilter === status ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <RoomStatusModal
            room={selected}
            updating={updating}
            updateError={updateError}
            notes={notes}
            onNotesChange={setNotes}
            onClose={() => { setSelected(null); setUpdateError(null); setNotes(''); }}
            onTransition={(target) => void handleTransition(selected, target)}
            transitionsFor={transitionsFor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ModalProps {
  room: ApiRoom;
  updating: boolean;
  updateError: string | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onTransition: (target: RoomStatus) => void;
  transitionsFor: (status: RoomStatus) => typeof WORKFLOW_TRANSITIONS;
}

function RoomStatusModal({
  room, updating, updateError, notes, onNotesChange, onClose, onTransition, transitionsFor,
}: ModalProps) {
  const status = asRoomStatus(room.status as string);
  const config = STATUS_CONFIG[status];
  const suggested = transitionsFor(status);
  const type = room.room_type?.name ?? room.roomType?.name ?? 'Room';
  const allStatuses = Object.keys(STATUS_CONFIG) as RoomStatus[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
      >
        <div className="p-5 text-white" style={{ background: config.dot }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs opacity-80">Floor {room.floor}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
              aria-label="Close room details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h3 className="text-xl font-bold">Room {room.room_number}</h3>
          <p className="text-white/80 text-sm">{type}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 rounded-full px-2 py-1">
            <config.Icon className="w-3.5 h-3.5" />
            {config.label}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600" htmlFor="hk-notes">
              Notes (optional)
            </label>
            <textarea
              id="hk-notes"
              rows={2}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. Towels restocked, AC serviced"
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
            />
          </div>

          {suggested.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Suggested next step</p>
              <div className="grid grid-cols-1 gap-2">
                {suggested.map((t) => {
                  const next = STATUS_CONFIG[t.to];
                  return (
                    <button
                      key={t.to}
                      disabled={updating}
                      onClick={() => onTransition(t.to)}
                      className="inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                      style={{ background: next.dot }}
                    >
                      <span>{t.label}</span>
                      <span className="opacity-80">→ {next.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <details className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <summary className="text-xs font-semibold text-slate-600 cursor-pointer">Other status</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {allStatuses
                .filter((s) => s !== status && !suggested.some((t) => t.to === s))
                .map((s) => (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => onTransition(s)}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
            </div>
          </details>

          {updateError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{updateError}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

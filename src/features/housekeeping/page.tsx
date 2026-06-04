import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BedDouble,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ApiHousekeepingTask, type ApiRoom, createHousekeepingTask, fetchRooms } from '@/lib/protectedEndpoints';
import { useHousekeepingStore } from '@/app/store/housekeepingStore';

const STATUS_CONFIG = {
  dirty: { label: 'Dirty', bg: 'bg-red-100', text: 'text-red-600', dot: '#ef4444', icon: AlertCircle },
  cleaning: { label: 'Cleaning', bg: 'bg-amber-100', text: 'text-amber-600', dot: '#f59e0b', icon: RefreshCw },
  clean: { label: 'Clean', bg: 'bg-green-100', text: 'text-green-600', dot: '#22c55e', icon: CheckCircle },
  inspected: { label: 'Inspected', bg: 'bg-blue-100', text: 'text-blue-600', dot: '#3b82f6', icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  high: { label: 'High', bg: 'bg-red-50', text: 'text-red-500' },
  normal: { label: 'Normal', bg: 'bg-gray-50', text: 'text-gray-500' },
  low: { label: 'Low', bg: 'bg-green-50', text: 'text-green-500' },
  urgent: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-500' },
};

const STAFF = ['Jane Mwende', 'Peter Njoroge', 'Alice Waweru', 'Tom Kariuki'];

const ROOM_STATUS_CONFIG: Record<string, { label: string; dot: string; card: string }> = {
  available: { label: 'Available', dot: 'bg-emerald-500', card: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  occupied: { label: 'Occupied', dot: 'bg-red-500', card: 'bg-red-50 text-red-700 border-red-200' },
  reserved: { label: 'Reserved', dot: 'bg-blue-500', card: 'bg-blue-50 text-blue-700 border-blue-200' },
  dirty: { label: 'Dirty', dot: 'bg-amber-500', card: 'bg-amber-50 text-amber-700 border-amber-200' },
  cleaning: { label: 'Cleaning', dot: 'bg-amber-500', card: 'bg-amber-50 text-amber-700 border-amber-200' },
  maintenance: { label: 'Maintenance', dot: 'bg-slate-500', card: 'bg-slate-50 text-slate-700 border-slate-200' },
};

interface Task {
  id: number;
  room: string;
  type: string;
  floor: number;
  status: keyof typeof STATUS_CONFIG;
  priority: keyof typeof PRIORITY_CONFIG;
  assignedTo: string | null;
  notes: string;
  updatedAt: string;
}

function mapHousekeepingTask(task: ApiHousekeepingTask): Task {
  const room = task.room;
  const backendStatus = task.status;

  return {
    id: task.id,
    room: room?.room_number ?? String(task.id),
    type: room?.room_type?.name ?? room?.roomType?.name ?? 'Room',
    floor: room?.floor ?? 0,
    status: backendStatus === 'completed' ? 'clean' : backendStatus === 'in_progress' ? 'cleaning' : 'dirty',
    priority: task.priority,
    assignedTo: task.assigned_staff?.name ?? task.assignee?.name ?? null,
    notes: task.notes ?? '',
    updatedAt: task.updated_at ? new Date(task.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now',
  };
}

interface NewTaskForm {
  roomId: number | '';
  taskType: string;
  priority: 'low' | 'normal' | 'urgent';
  notes: string;
  assignedTo: string;
}

const emptyNewTask: NewTaskForm = {
  roomId: '',
  taskType: 'cleaning',
  priority: 'normal',
  notes: '',
  assignedTo: '',
};

export default function HousekeepingPage() {
  const apiTasks = useHousekeepingStore((state) => state.tasks);
  const loadError = useHousekeepingStore((state) => state.error);
  const fetchTasks = useHousekeepingStore((state) => state.fetchTasks);
  const updateTask = useHousekeepingStore((state) => state.updateTask);
  const completeTask = useHousekeepingStore((state) => state.completeTask);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<keyof typeof STATUS_CONFIG | 'all'>('all');
  const [selected, setSelected] = useState<Task | null>(null);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskForm>(emptyNewTask);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const tasks: Task[] = useMemo(() => apiTasks.map(mapHousekeepingTask), [apiTasks]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchRooms();
        const list: ApiRoom[] = Array.isArray(res.data) ? res.data : res.data.data ?? [];
        if (!cancelled) setRooms(list);
      } catch {
        if (!cancelled) setRooms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = tasks.filter((task) => {
    const normalizedSearch = search.toLowerCase();
    const matchSearch = task.room.includes(search) || task.type.toLowerCase().includes(normalizedSearch);
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = useMemo(() => ({
    dirty: tasks.filter((task) => task.status === 'dirty').length,
    cleaning: tasks.filter((task) => task.status === 'cleaning').length,
    clean: tasks.filter((task) => task.status === 'clean').length,
    inspected: tasks.filter((task) => task.status === 'inspected').length,
  }), [tasks]);

  const updateStatus = async (id: number, status: keyof typeof STATUS_CONFIG) => {
    try {
      if (status === 'clean' || status === 'inspected') {
        await completeTask(id);
      } else {
        await updateTask(id, {
          status: status === 'cleaning' ? 'in_progress' : 'pending',
        });
      }
      await fetchTasks();
    } catch {
      // Store already surfaces the error.
    }
    setSelected(null);
  };

  const assignStaff = async (id: number, staff: string) => {
    try {
      await updateTask(id, { assigned_to: staff });
      await fetchTasks();
    } catch {
      // ignore; store shows the error
    }
  };

  const handleCreate = async () => {
    if (!newTask.roomId) {
      setCreateError('Pick a room.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const payload: Record<string, unknown> = {
        room_id: newTask.roomId,
        task_type: newTask.taskType,
        priority: newTask.priority,
        notes: newTask.notes || undefined,
        status: 'pending',
      };
      if (newTask.assignedTo.trim()) {
        payload.assigned_to = newTask.assignedTo.trim();
      }
      await createHousekeepingTask(payload);
      setNewTask(emptyNewTask);
      setNewTaskOpen(false);
      await fetchTasks();
    } catch (err) {
      setCreateError((err as { message?: string })?.message ?? 'Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-5 space-y-5 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow">Housekeeping</h2>
          <p className="text-white/70 text-sm">Room cleaning and maintenance status</p>
        </div>
        <button onClick={() => setNewTaskOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Needs Cleaning', value: counts.dirty, gradient: 'from-red-400 to-red-600', icon: AlertCircle },
          { label: 'In Progress', value: counts.cleaning, gradient: 'from-amber-400 to-amber-600', icon: RefreshCw },
          { label: 'Cleaned', value: counts.clean, gradient: 'from-green-400 to-green-600', icon: CheckCircle },
          { label: 'Inspected', value: counts.inspected, gradient: 'from-blue-400 to-blue-600', icon: Sparkles },
        ].map(({ label, value, gradient, icon: Icon }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl p-4 text-white shadow-lg bg-gradient-to-br relative overflow-hidden', gradient)}
          >
            <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-white/10" />
            <Icon className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-white/80 text-xs mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Room Status Grid</h3>
            <p className="text-xs text-gray-400">Quick room readiness overview</p>
          </div>
          <BedDouble className="w-5 h-5 text-blue-500" />
        </div>
        {rooms.length === 0 ? (
          <p className="text-xs text-gray-500">No rooms configured yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
            {rooms.map((room) => {
              const status = room.status as string;
              const config = ROOM_STATUS_CONFIG[status] ?? ROOM_STATUS_CONFIG.available;
              const roomType = room.room_type?.name ?? room.roomType?.name ?? 'Room';
              return (
                <div
                  key={room.id}
                  className={cn('rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md', config.card)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">Room {room.room_number}</p>
                    <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', config.dot)} />
                  </div>
                  <p className="mt-1 text-xs opacity-75">{roomType}</p>
                  <p className="mt-2 text-xs font-semibold">{config.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search room number or type..."
            className="w-full pl-9 pr-3 h-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'dirty', 'cleaning', 'clean', 'inspected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors',
                statusFilter === status ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status];
            const priorityConfig = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.normal;
            const Icon = statusConfig.icon;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelected(task)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{ background: statusConfig.dot }}
                    >
                      {task.room}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Room {task.room}</p>
                      <p className="text-xs text-gray-400">{task.type} - Floor {task.floor}</p>
                    </div>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', priorityConfig.bg, priorityConfig.text)}>
                    {priorityConfig.label}
                  </span>
                </div>

                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl mb-3', statusConfig.bg)}>
                  <Icon className={cn('w-4 h-4', statusConfig.text)} />
                  <span className={cn('text-xs font-semibold', statusConfig.text)}>{statusConfig.label}</span>
                </div>

                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {task.assignedTo ? (
                      <span className="text-xs text-gray-600 truncate">{task.assignedTo}</span>
                    ) : (
                      <span className="text-xs text-gray-300 italic">Unassigned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{task.updatedAt}</span>
                  </div>
                </div>

                {task.notes && (
                  <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2">{task.notes}</p>
                )}

                <div className="flex gap-2 mt-3" onClick={(event) => event.stopPropagation()}>
                  {task.status === 'dirty' && (
                    <button
                      onClick={() => updateStatus(task.id, 'cleaning')}
                      className="flex-1 h-8 bg-amber-500 text-white rounded-xl text-xs font-medium hover:bg-amber-600 transition-colors"
                    >
                      Start Cleaning
                    </button>
                  )}
                  {task.status === 'cleaning' && (
                    <button
                      onClick={() => updateStatus(task.id, 'clean')}
                      className="flex-1 h-8 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      Mark Cleaned
                    </button>
                  )}
                  {task.status === 'clean' && (
                    <button
                      onClick={() => updateStatus(task.id, 'inspected')}
                      className="flex-1 h-8 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                      Mark Inspected
                    </button>
                  )}
                  {task.status === 'inspected' && (
                    <div className="flex-1 h-8 bg-gray-50 text-gray-400 rounded-xl text-xs font-medium flex items-center justify-center">
                      Ready
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && tasks.length > 0 && (
        <p className="text-center text-sm text-white/70">No housekeeping tasks match the filter.</p>
      )}
      {tasks.length === 0 && !loadError && (
        <p className="text-center text-sm text-white/70">No housekeeping tasks yet. Click "New Task" to create one.</p>
      )}

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
            >
              <div className="p-5 text-white" style={{ background: STATUS_CONFIG[selected.status].dot }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs opacity-80">Floor {selected.floor}</span>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
                    aria-label="Close housekeeping details"
                  >
                    <X className="w-4 w-4" />
                  </button>
                </div>
                <h3 className="text-xl font-bold">Room {selected.room}</h3>
                <p className="text-white/80 text-sm">{selected.type}</p>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last updated {selected.updatedAt}</span>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Assign Staff</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STAFF.map((staff) => (
                      <button
                        key={staff}
                        onClick={() => assignStaff(selected.id, staff)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                          selected.assignedTo === staff ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        )}
                      >
                        {staff}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selected.id, status)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors',
                          selected.status === status ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                        )}
                        style={selected.status === status ? { background: STATUS_CONFIG[status].dot } : {}}
                      >
                        {STATUS_CONFIG[status].label}
                      </button>
                    ))}
                  </div>
                </div>

                {selected.notes && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{selected.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newTaskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setNewTaskOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <h3 className="text-base font-bold text-slate-900">New housekeeping task</h3>
                <button onClick={() => setNewTaskOpen(false)} className="rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 px-5 py-4">
                <label className="block text-xs font-semibold text-slate-600">
                  Room
                  <select
                    value={newTask.roomId}
                    onChange={(e) => setNewTask({ ...newTask, roomId: e.target.value ? Number(e.target.value) : '' })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>Room {room.room_number} - {room.room_type?.name ?? 'Room'}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Task type
                  <select
                    value={newTask.taskType}
                    onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
                  >
                    <option value="cleaning">Cleaning</option>
                    <option value="turndown">Turndown service</option>
                    <option value="maintenance">Maintenance check</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Priority
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as NewTaskForm['priority'] })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Assign to (optional)
                  <input
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    placeholder="Staff name"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Notes
                  <textarea
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm font-normal"
                  />
                </label>
                {createError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{createError}</p>}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <button onClick={() => setNewTaskOpen(false)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
                  {creating ? 'Creating…' : 'Create task'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

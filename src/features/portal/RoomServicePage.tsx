import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Coffee, Loader2, LogIn, Minus, Plus, Search, ShoppingBag, Trash2, UtensilsCrossed } from 'lucide-react';
import {
  fetchPortalRoomServiceMenu,
  lookupPortalRoomServiceOrder,
  placePortalRoomServiceOrder,
  type RoomServiceMenuItem,
  type RoomServiceOrder,
} from '@/lib/portalApi';

type CartLine = { item: RoomServiceMenuItem; qty: number };
type OrderStatus = 'received' | 'preparing' | 'on_the_way' | 'delivered';

const STATUS_FLOW: OrderStatus[] = ['received', 'preparing', 'on_the_way', 'delivered'];
const STATUS_LABEL: Record<OrderStatus, string> = {
  received:   'Order received',
  preparing:  'In the kitchen',
  on_the_way: 'On the way to your room',
  delivered:  'Delivered',
};

const KNOWN_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Snacks'] as const;

export default function PortalRoomServicePage() {
  const [reference, setReference] = useState('');
  const [lastName, setLastName]   = useState('');
  const [lookupError, setLookupError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated]   = useState(false);
  const [guestName, setGuestName]   = useState('');

  const [menu, setMenu]     = useState<RoomServiceMenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [active, setActive] = useState<string>('Breakfast');

  const [cart, setCart]     = useState<CartLine[]>([]);
  const [placing, setPlacing] = useState(false);
  const [order, setOrder]   = useState<RoomServiceOrder | null>(null);
  const [orderError, setOrderError] = useState('');

  const pollRef = useRef<number | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const c of KNOWN_CATEGORIES) {
      if (menu.some((m) => m.category === c)) {
        ordered.push(c);
        seen.add(c);
      }
    }
    for (const m of menu) {
      if (!seen.has(m.category)) {
        ordered.push(m.category);
        seen.add(m.category);
      }
    }
    return ordered;
  }, [menu]);

  const items = useMemo(() => menu.filter((m) => m.category === active), [menu, active]);
  const total = useMemo(() => cart.reduce((s, l) => s + Number(l.item.price) * l.qty, 0), [cart]);

  useEffect(() => {
    if (validated) void loadMenu();
  }, [validated]);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  async function loadMenu() {
    setMenuLoading(true);
    try {
      const res = await fetchPortalRoomServiceMenu();
      const data = res.data.data ?? {};
      const flat: RoomServiceMenuItem[] = [];
      for (const cat of Object.keys(data)) {
        for (const item of (data as Record<string, RoomServiceMenuItem[]>)[cat]) {
          flat.push(item);
        }
      }
      setMenu(flat);
      if (flat.length && !flat.some((m) => m.category === active)) {
        setActive(flat[0].category);
      }
    } catch {
      setOrderError('Could not load the menu. Please try again.');
    } finally {
      setMenuLoading(false);
    }
  }

  async function validateStay(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !lastName.trim()) {
      setLookupError('Both the booking reference and last name are required.');
      return;
    }
    setValidating(true);
    setLookupError('');
    try {
      // Re-use the booking lookup so we can verify the stay without exposing a new endpoint.
      const res = await import('@/lib/portalApi').then((m) => m.lookupPortalBooking({ reference: reference.trim(), lastName: lastName.trim() }));
      if (!res.data.success) throw new Error('lookup failed');
      const booking = res.data.data.booking;
      const guest = booking?.guest;
      const name = guest ? `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim() : lastName.trim();
      setGuestName(name || lastName.trim());
      setValidated(true);
    } catch {
      setLookupError('We could not find a stay with that reference and last name.');
    } finally {
      setValidating(false);
    }
  }

  function add(item: RoomServiceMenuItem) {
    setCart((c) => {
      const found = c.find((l) => l.item.id === item.id);
      if (found) return c.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { item, qty: 1 }];
    });
  }
  function dec(id: number) {
    setCart((c) => c.flatMap((l) => l.item.id === id ? (l.qty === 1 ? [] : [{ ...l, qty: l.qty - 1 }]) : [l]));
  }
  function reset() {
    setCart([]);
    setOrder(null);
    setOrderError('');
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function pollStatus(reference: string) {
    try {
      const res = await lookupPortalRoomServiceOrder({ reference, lastName: lastName.trim() });
      const next = res.data.data;
      setOrder(next);
      const terminal = next.status === 'delivered' || next.status === 'cancelled';
      if (terminal && pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      // swallow polling errors — they recover on the next tick
    }
  }

  async function place() {
    if (cart.length === 0) return;
    setPlacing(true);
    setOrderError('');
    try {
      const res = await placePortalRoomServiceOrder({
        reference: reference.trim(),
        last_name: lastName.trim(),
        guest_name: guestName,
        room_number: undefined,
        items: cart.map((l) => ({ menu_item_id: l.item.id, quantity: l.qty })),
      });
      const newOrder = res.data.data;
      setOrder(newOrder);
      setCart([]);
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(() => { void pollStatus(newOrder.reference); }, 5000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setOrderError(msg ?? 'Could not place the order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (!validated) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Delivered to your room</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Room Service</h1>
          <p className="mt-1 text-sm text-cyan-50/70">Order from our kitchen and track your order in real time.</p>
        </header>

        <form onSubmit={validateStay} className="space-y-4 rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <LogIn className="h-4 w-4" /> Find your stay
          </h2>
          <p className="text-sm text-slate-600">Enter the booking reference and the last name on the reservation to view the menu and place an order.</p>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Booking reference</span>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. BK-123456"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Last name</span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="As on the reservation"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </label>
          </div>
          {lookupError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{lookupError}</p>
          )}
          <button
            type="submit"
            disabled={validating}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Delivered to your room</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Room Service</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Order from our kitchen and track your order in real time.</p>
        <p className="mt-2 text-[11px] text-cyan-100/60">Booking {reference} · {lastName}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setActive(c)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${active === c ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/15 bg-white/10 text-cyan-50/80 hover:bg-white/20'}`}>
                {c === 'Drinks' ? <Coffee className="h-3.5 w-3.5" /> : <UtensilsCrossed className="h-3.5 w-3.5" />} {c}
              </button>
            ))}
          </div>

          {menuLoading ? (
            <div className="flex justify-center py-10 text-cyan-100">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="rounded-2xl border border-white/14 bg-white/95 p-6 text-center text-sm text-slate-500 shadow-xl">No items in this category right now.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((m) => (
                <article key={m.id} className="rounded-2xl border border-white/14 bg-white/95 p-4 text-slate-900 shadow-xl">
                  <h3 className="text-sm font-bold">{m.name}</h3>
                  {m.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{m.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-base font-bold text-cyan-700">KES {Number(m.price).toLocaleString()}</p>
                    <button onClick={() => add(m)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/14 bg-white/95 p-5 text-slate-900 shadow-xl">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              <ShoppingBag className="h-4 w-4" /> Your order
            </h2>
            {cart.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No items yet. Add something from the menu.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {cart.map(({ item, qty }) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{item.name}</span>
                    <button onClick={() => dec(item.id)} className="rounded-md bg-slate-100 p-1 hover:bg-slate-200"><Minus className="h-3 w-3" /></button>
                    <span className="w-6 text-center text-xs font-semibold">{qty}</span>
                    <button onClick={() => add(item)} className="rounded-md bg-slate-100 p-1 hover:bg-slate-200"><Plus className="h-3 w-3" /></button>
                    <span className="w-16 text-right text-xs font-semibold text-slate-700">KES {(Number(item.price) * qty).toLocaleString()}</span>
                    <button onClick={() => setCart((c) => c.filter((l) => l.item.id !== item.id))} className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            )}
            {cart.length > 0 && (
              <>
                <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
                  <span>Total</span><span className="text-cyan-700">KES {total.toLocaleString()}</span>
                </div>
                {orderError && (
                  <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{orderError}</p>
                )}
                <button onClick={place} disabled={placing}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60">
                  {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  Place order
                </button>
              </>
            )}
          </section>

          <AnimatePresence>
            {order && (
              <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-emerald-200 bg-white/95 p-5 text-slate-900 shadow-xl">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  <Clock className="h-4 w-4" /> Order status
                </h2>
                <p className="mt-1 text-xs font-mono text-cyan-700">{order.reference}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {order.items.length} item{order.items.length === 1 ? '' : 's'} · KES {Number(order.total).toLocaleString()}
                </p>
                {order.status === 'cancelled' ? (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">This order was cancelled.</p>
                ) : (
                  <ol className="mt-3 space-y-2">
                    {STATUS_FLOW.map((s) => {
                      const idx = STATUS_FLOW.indexOf(s);
                      const current = STATUS_FLOW.indexOf(order.status as OrderStatus);
                      const done = idx <= current;
                      return (
                        <li key={s} className="flex items-center gap-2 text-sm">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                          </span>
                          <span className={done ? 'font-semibold text-slate-800' : 'text-slate-500'}>{STATUS_LABEL[s]}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <button onClick={reset} className="mt-4 inline-flex h-8 items-center gap-1 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                  Start a new order
                </button>
              </motion.section>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}

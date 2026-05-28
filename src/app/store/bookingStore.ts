import { create } from 'zustand';
import type { Room, Guest, Extra } from '@/types';

interface BookingDates {
  checkIn: Date | null;
  checkOut: Date | null;
}

interface BookingState {
  dates: BookingDates;
  selectedRoom: Room | null;
  guestInfo: Partial<Guest> | null;
  extras: Extra[];
  discount: number;
  adults: number;
  children: number;
  notes: string;
  nights: number;
  subtotal: number;
  total: number;
  setDates: (dates: BookingDates) => void;
  setRoom: (room: Room | null) => void;
  setGuest: (guest: Partial<Guest>) => void;
  addExtra: (extra: Extra) => void;
  removeExtra: (id: number) => void;
  setDiscount: (pct: number) => void;
  setAdults: (n: number) => void;
  setChildren: (n: number) => void;
  setNotes: (s: string) => void;
  reset: () => void;
  calculateTotals: () => void;
}

const defaultState = {
  dates: { checkIn: null, checkOut: null },
  selectedRoom: null,
  guestInfo: null,
  extras: [],
  discount: 0,
  adults: 1,
  children: 0,
  notes: '',
  nights: 0,
  subtotal: 0,
  total: 0,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...defaultState,
  setDates: (dates) => { set({ dates }); get().calculateTotals(); },
  setRoom: (room) => { set({ selectedRoom: room }); get().calculateTotals(); },
  setGuest: (guest) => set({ guestInfo: guest }),
  addExtra: (extra) => { set((s) => ({ extras: [...s.extras, extra] })); get().calculateTotals(); },
  removeExtra: (id) => { set((s) => ({ extras: s.extras.filter((e) => e.id !== id) })); get().calculateTotals(); },
  setDiscount: (pct) => { set({ discount: pct }); get().calculateTotals(); },
  setAdults: (n) => set({ adults: n }),
  setChildren: (n) => set({ children: n }),
  setNotes: (s) => set({ notes: s }),
  reset: () => set(defaultState),
  calculateTotals: () => {
    const { dates, selectedRoom, extras, discount } = get();
    if (!dates.checkIn || !dates.checkOut || !selectedRoom) {
      set({ nights: 0, subtotal: 0, total: 0 });
      return;
    }
    const nights = Math.max(1, Math.round(
      (dates.checkOut.getTime() - dates.checkIn.getTime()) / (1000 * 60 * 60 * 24)
    ));
    const roomCost = selectedRoom.room_type.base_price * nights;
    const extrasCost = extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
    const subtotal = roomCost + extrasCost;
    const total = subtotal * (1 - discount / 100);
    set({ nights, subtotal, total });
  },
}));
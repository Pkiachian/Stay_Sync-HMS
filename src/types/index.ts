export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'receptionist' | 'front_desk' | 'housekeeping' | 'pos_staff';
  avatar?: string;
}

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'cleaning' | 'maintenance' | 'blocked';

export interface RoomType {
  id: number;
  name: string;
  base_price: number;
  max_occupancy: number;
}

export interface Room {
  id: number;
  number: string;
  floor: number;
  status: RoomStatus;
  room_type: RoomType;
}

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface Extra {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: number;
  reference: string;
  room: Room;
  guest: Guest;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  adults: number;
  children: number;
  extras: Extra[];
  discount: number;
  total: number;
  notes?: string;
  created_at: string;
}

export interface TapeChartBooking {
  id: number;
  reference: string;
  guest_name: string;
  room_id: number;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  nights: number;
}

export interface TapeChartRoom {
  id: number;
  number: string;
  floor: number;
  type_name: string;
  status: RoomStatus;
  bookings: TapeChartBooking[];
}

export interface HousekeepingTask {
  id: number;
  room: Room;
  status: 'dirty' | 'cleaning' | 'clean' | 'inspected';
  priority: 'high' | 'normal' | 'low';
  assigned_to?: User;
  notes?: string;
  updated_at: string;
}

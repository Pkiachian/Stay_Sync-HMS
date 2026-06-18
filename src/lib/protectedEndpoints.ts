import api from './api';

// ─── Response shapes that match Laravel's Controller::success() wrapper ────────

export type PaginatedResponse<T> = { data: T[] };
export type ApiResponse<T> = { success?: boolean; message?: string; data: T };

// ─── Dashboard (matches backend DashboardController::stats) ──────────────────

export type DashboardStatsResponse = {
  total_rooms: number;
  total_guests: number;
  total_bookings: number;
  available_rooms: number;
  occupied_rooms: number;
  dirty_rooms: number;
  cleaning_rooms: number;
  maintenance_rooms: number;
  checked_in_bookings: number;
  pending_bookings: number;
  checked_out_bookings: number;
  cancelled_bookings: number;
  today_revenue: number;
  monthly_revenue: number;
  total_revenue: number;
  occupancy_rate: string;
  monthly_booking_trends: Array<{ month: number; total: number }>;
};

// ─── Rooms ───────────────────────────────────────────────────────────────────

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'dirty'
  | 'cleaning'
  | 'clean'
  | 'inspected'
  | 'reserved'
  | 'maintenance'
  | 'out_of_service';

export type ApiRoom = {
  id: number;
  room_number: string;
  floor: number;
  status: RoomStatus | string;
  is_active?: boolean;
  // Laravel serializes the `roomType()` relation as `room_type`
  room_type?: {
    id: number;
    name: string;
    base_price?: number;
  };
  roomType?: {
    id: number;
    name: string;
    base_price?: number;
  };
};

export type RoomStatusSummary = Record<RoomStatus, number> & { total_rooms?: number };

export type ApiRoomType = {
  id: number;
  name: string;
  slug?: string;
  base_price: number;
  max_occupancy: number;
  description?: string;
  amenities?: string[];
};

// ─── Bookings ────────────────────────────────────────────────────────────────

export type ApiBooking = {
  id: number;
  booking_reference: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_price: number;
  subtotal?: number;
  tax_amount?: number;
  num_adults?: number;
  num_children?: number;
  special_requests?: string;
  guest?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  room?: ApiRoom;
};

// ─── Guests ──────────────────────────────────────────────────────────────────

export type ApiGuest = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  nationality?: string;
  id_type?: string;
  id_number?: string;
  address?: string;
  country?: string;
  city?: string;
  total_stays?: number;
  bookings?: ApiBooking[];
};

// ─── Housekeeping ────────────────────────────────────────────────────────────

export type ApiHousekeepingTask = {
  id: number;
  task_type: string;
  priority: 'low' | 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  updated_at?: string;
  completed_at?: string;
  room?: ApiRoom;
  // Laravel eager-loads `assignedStaff`; serializes to `assigned_staff`
  assigned_staff?: { id: number; name: string };
  assignee?: { id: number; name: string };
};

// ─── Reports (matches backend ReportController) ──────────────────────────────

export type RevenueReport = {
  total_revenue: number;
  today_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
};

export type BookingsReport = {
  total_bookings: number;
  confirmed: number;
  checked_in: number;
  checked_out: number;
  cancelled: number;
  pending: number;
};

export type OccupancyReport = {
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  dirty_rooms: number;
  maintenance_rooms: number;
  occupancy_rate: string;
};

export type MonthlyRevenueRow = { month: number; total: number };
export type MonthlyBookingsRow = { month: number; total: number };

// ─── Tape chart (matches backend BookingController::calendar) ────────────────

export type TapeChartBooking = {
  room_id: number;
  room_number: string;
  status: string;
  check_in: string;
  check_out: string;
  booking_id?: number;
  guest_name?: string;
  booking_reference?: string;
  // extra fields the tape chart page may want; absent unless backend provides them
  id?: number;
  reference?: string;
  guest?: { first_name?: string; last_name?: string };
};

export type TapeChartRoom = {
  id: number;
  number: string;
  floor: number;
  type_name: string;
  status: string;
  bookings: TapeChartBooking[];
};

export type TapeChartResponse = {
  rooms: TapeChartRoom[];
  date_range: string[];
};

// ─── API functions ───────────────────────────────────────────────────────────

export function fetchDashboardStats() {
  return api.get<ApiResponse<DashboardStatsResponse> | DashboardStatsResponse>('/dashboard/stats');
}

export type SearchHit = {
  type: 'guest' | 'booking' | 'room';
  id: number;
  label: string;
  sub?: string;
  status?: string;
  stays?: number;
  last_booking_reference?: string;
};

export type SearchResponse = {
  query: string;
  guests: SearchHit[];
  bookings: SearchHit[];
  rooms: SearchHit[];
  total: number;
};

export function searchAll(q: string, limit = 8) {
  return api.get<ApiResponse<SearchResponse> | SearchResponse>('/search', { params: { q, limit } });
}

export function fetchRooms(params?: Record<string, string | number>) {
  return api.get<PaginatedResponse<ApiRoom> | ApiRoom[]>('/rooms', { params });
}

export function fetchRoomStatusSummary() {
  return api.get<{ success?: boolean; data: { summary: RoomStatusSummary; total_rooms: number } }>(
    '/rooms/status-summary',
  );
}

export function updateRoomStatus(roomId: number, payload: { status: RoomStatus; notes?: string }) {
  return api.post<{ success?: boolean; data: ApiRoom }>(`/rooms/${roomId}/status`, payload);
}

export function fetchRoomTypes() {
  return api.get<PaginatedResponse<ApiRoomType> | ApiRoomType[]>('/room-types');
}

export function fetchGuests(params?: Record<string, string | number>) {
  return api.get<PaginatedResponse<ApiGuest> | ApiGuest[]>('/guests', { params });
}

export function createGuest(payload: Record<string, unknown>) {
  return api.post<ApiResponse<ApiGuest> | ApiGuest>('/guests', payload);
}

export function updateGuest(id: number, payload: Record<string, unknown>) {
  return api.put<ApiResponse<ApiGuest> | ApiGuest>(`/guests/${id}`, payload);
}

export function deleteGuest(id: number) {
  return api.delete<ApiResponse<unknown> | null>(`/guests/${id}`);
}

export function fetchBookings(params?: Record<string, string | number>) {
  return api.get<PaginatedResponse<ApiBooking> | ApiBooking[]>('/bookings', { params });
}

export function createBooking(payload: Record<string, unknown>) {
  return api.post<ApiResponse<ApiBooking> | ApiBooking>('/bookings', payload);
}

export function updateBooking(id: number, payload: Record<string, unknown>) {
  return api.put<ApiResponse<ApiBooking> | ApiBooking>(`/bookings/${id}`, payload);
}

export function cancelBooking(id: number) {
  return updateBooking(id, { status: 'cancelled' });
}

export function checkInBooking(id: number) {
  return api.post<ApiResponse<ApiBooking> | ApiBooking>(`/bookings/${id}/check-in`);
}

export function checkOutBooking(id: number) {
  return api.post<ApiResponse<ApiBooking> | ApiBooking>(`/bookings/${id}/check-out`);
}

export function fetchTapeChart(startDate: string, endDate: string) {
  return api.get<ApiResponse<TapeChartResponse> | TapeChartResponse>('/booking-calendar', {
    params: { start_date: startDate, end_date: endDate },
  });
}

export function fetchHousekeepingTasks(params?: Record<string, string | number>) {
  return api.get<ApiResponse<ApiHousekeepingTask[]> | PaginatedResponse<ApiHousekeepingTask> | ApiHousekeepingTask[]>('/housekeeping-tasks', { params });
}

export function createHousekeepingTask(payload: Record<string, unknown>) {
  return api.post<ApiResponse<ApiHousekeepingTask> | ApiHousekeepingTask>('/housekeeping-tasks', payload);
}

export function updateHousekeepingTask(taskId: number, data: Record<string, unknown>) {
  return api.put<ApiResponse<ApiHousekeepingTask> | ApiHousekeepingTask>(`/housekeeping-tasks/${taskId}`, data);
}

export function completeHousekeepingTask(taskId: number) {
  return updateHousekeepingTask(taskId, { status: 'completed' });
}

export function deleteHousekeepingTask(taskId: number) {
  return api.delete<ApiResponse<unknown> | null>(`/housekeeping-tasks/${taskId}`);
}

export function fetchRevenueReport() {
  return api.get<ApiResponse<RevenueReport> | RevenueReport>('/reports/revenue');
}

export function fetchBookingsReport() {
  return api.get<ApiResponse<BookingsReport> | BookingsReport>('/reports/bookings');
}

export function fetchOccupancyReport() {
  return api.get<ApiResponse<OccupancyReport> | OccupancyReport>('/reports/occupancy');
}

export function fetchMonthlyRevenueReport() {
  return api.get<ApiResponse<MonthlyRevenueRow[]> | MonthlyRevenueRow[]>('/reports/monthly-revenue');
}

export function fetchMonthlyBookingsReport() {
  return api.get<ApiResponse<MonthlyBookingsRow[]> | MonthlyBookingsRow[]>('/reports/monthly-bookings');
}

export function fetchSettings() {
  return api.get<Record<string, string>>('/settings');
}

export type ApiRateOverride = {
  id: number;
  room_type_id: number;
  start_date: string;
  end_date: string;
  price: number;
  roomType?: { id: number; name: string };
  room_type?: { id: number; name: string };
};

export function fetchRateOverrides() {
  return api.get<PaginatedResponse<ApiRateOverride> | ApiRateOverride[]>('/rate-overrides');
}

export function createRateOverride(payload: Record<string, unknown>) {
  return api.post<ApiResponse<ApiRateOverride> | ApiRateOverride>('/rate-overrides', payload);
}

export function updateRateOverride(id: number, payload: Record<string, unknown>) {
  return api.put<ApiResponse<ApiRateOverride> | ApiRateOverride>(`/rate-overrides/${id}`, payload);
}

export function deleteRateOverride(id: number) {
  return api.delete<ApiResponse<unknown> | null>(`/rate-overrides/${id}`);
}

export function fetchAbout() {
  return api.get('/about');
}

export function fetchContactInfo() {
  return api.get('/contact');
}

export type StaffRoomServiceOrder = {
  id: number;
  reference: string;
  booking_id: number | null;
  guest_name: string;
  room_number: string | null;
  phone: string | null;
  status: 'received' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  total: string;
  notes: string | null;
  handled_by: number | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    menu_item_id: number;
    item_name: string;
    unit_price: string;
    quantity: number;
    line_total: string;
  }>;
  booking?: { id: number; booking_reference: string; guest?: { first_name?: string; last_name?: string } };
  handler?: { id: number; name: string } | null;
};

export function fetchRoomServiceOrders(params?: Record<string, string | number>) {
  return api.get<{ success: boolean; data: { data: StaffRoomServiceOrder[] } | StaffRoomServiceOrder[] }>('/room-service-orders', { params });
}

export function updateRoomServiceOrderStatus(id: number, status: StaffRoomServiceOrder['status']) {
  return api.patch<{ success: boolean; data: StaffRoomServiceOrder }>(`/room-service-orders/${id}`, { status });
}

// ─── Payments (desk) ─────────────────────────────────────────────────────────

export type ApiPayment = {
  id: number;
  booking_id: number;
  amount: string | number;
  payment_method: 'cash' | 'mpesa' | 'card' | 'bank';
  transaction_reference: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  booking?: ApiBooking | null;
};

export function verifyMpesaPayment(reference: string) {
  return api.get<{ success: boolean; data: { payment: ApiPayment; booking: ApiBooking } }>(
    '/payments/verify',
    { params: { reference } },
  );
}

export function recordManualPayment(payload: {
  booking_id: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank';
  payment_date: string; // YYYY-MM-DD
  reference_number?: string;
  status?: 'completed' | 'pending';
}) {
  return api.post<{ success: boolean; data: ApiPayment }>('/payments', payload);
}

// ─── Notifications (header bell) ──────────────────────────────────────────────

export type NotificationType = 'booking' | 'payment' | 'room_status' | 'service_request';

export type ApiNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actor: string | null;
  created_at: string | null;
  href: string | null;
};

export function fetchNotifications(limit = 8) {
  return api.get<{ success?: boolean; data: { notifications: ApiNotification[]; count: number } }>(
    '/notifications',
    { params: { limit } },
  );
}

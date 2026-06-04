const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface ContactData {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
}

export interface RoomData {
    room_number: string;
    room_type_id: number;
    floor?: number;
    status?: string;
    is_active?: boolean;
}

export interface RoomTypeData {
    name: string;
    slug: string;
    base_price: number;
    max_occupancy: number;
    description?: string;
    amenities?: string[];
}

export interface GuestData {
    name: string;
    email: string;
    phone?: string;
    id_number?: string;
    nationality?: string;
}

export interface BookingData {
    guest_id: number;
    room_id: number;
    room_type_id: number;
    check_in: string;
    check_out: string;
    adults: number;
    children?: number;
    notes?: string;
}

export interface BookingUpdateData {
    room_id?: number;
    room_type_id?: number;
    check_in?: string;
    check_out?: string;
    adults?: number;
    children?: number;
    status?: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
    notes?: string;
}

export interface HousekeepingTaskData {
    room_id: number;
    assigned_to?: number;
    task_type: string;
    status?: string;
    notes?: string;
    scheduled_at?: string;
}

export interface PaymentData {
    booking_id: number;
    amount: number;
    method: string;
    reference?: string;
    status?: string;
}

export interface RateOverrideData {
    room_type_id: number;
    start_date: string;
    end_date: string;
    price: number;
}

export interface MpesaData {
    phone: string;
    amount: number;
    reference: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const request = async <T = unknown>(
    method: string,
    endpoint: string,
    data: unknown = null,
    token: string | null = null
): Promise<T> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config: RequestInit = { method, headers };
    if (data) config.body = JSON.stringify(data);

    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const json = await res.json();

    if (!res.ok) throw json;
    return json as T;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const register = (data: RegisterData)  => request('POST', '/register', data);
export const login    = (data: LoginData)      => request('POST', '/login',    data);
export const logout   = (token: string)        => request('POST', '/logout',   null,  token);
export const getUser  = (token: string)        => request('GET',  '/user',     null,  token);

// ─── Public ───────────────────────────────────────────────────────────────────

export const getAbout      = ()                    => request('GET',  '/about');
export const submitContact = (data: ContactData)   => request('POST', '/contact', data);

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const getRooms   = (token: string)                          => request('GET',    '/rooms',       null, token);
export const getRoom    = (id: number, token: string)              => request('GET',    `/rooms/${id}`, null, token);
export const createRoom = (data: RoomData, token: string)          => request('POST',   '/rooms',       data, token);
export const updateRoom = (id: number, data: RoomData, token: string) => request('PUT', `/rooms/${id}`, data, token);
export const deleteRoom = (id: number, token: string)              => request('DELETE', `/rooms/${id}`, null, token);

// ─── Room Types ───────────────────────────────────────────────────────────────

export const getRoomTypes   = (token: string)                                  => request('GET',    '/room-types',       null, token);
export const getRoomType    = (id: number, token: string)                      => request('GET',    `/room-types/${id}`, null, token);
export const createRoomType = (data: RoomTypeData, token: string)              => request('POST',   '/room-types',       data, token);
export const updateRoomType = (id: number, data: RoomTypeData, token: string)  => request('PUT',    `/room-types/${id}`, data, token);
export const deleteRoomType = (id: number, token: string)                      => request('DELETE', `/room-types/${id}`, null, token);

// ─── Guests ───────────────────────────────────────────────────────────────────

export const getGuests   = (token: string)                                => request('GET',    '/guests',       null, token);
export const getGuest    = (id: number, token: string)                    => request('GET',    `/guests/${id}`, null, token);
export const createGuest = (data: GuestData, token: string)               => request('POST',   '/guests',       data, token);
export const updateGuest = (id: number, data: GuestData, token: string)   => request('PUT',    `/guests/${id}`, data, token);
export const deleteGuest = (id: number, token: string)                    => request('DELETE', `/guests/${id}`, null, token);

// ─── Bookings ─────────────────────────────────────────────────────────────────

// Frontend uses BookingData with friendly field names; Laravel expects
// snake_case booking fields. Translate once at the boundary.
function mapBookingPayload(data: BookingData): Record<string, unknown> {
    return {
        guest_id: data.guest_id,
        room_id: data.room_id,
        room_type_id: data.room_type_id,
        check_in_date: data.check_in,
        check_out_date: data.check_out,
        num_adults: data.adults,
        num_children: data.children ?? 0,
        special_requests: data.notes ?? null,
    };
}

function mapBookingUpdatePayload(data: BookingUpdateData): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (data.room_id !== undefined) out.room_id = data.room_id;
    if (data.room_type_id !== undefined) out.room_type_id = data.room_type_id;
    if (data.check_in !== undefined) out.check_in_date = data.check_in;
    if (data.check_out !== undefined) out.check_out_date = data.check_out;
    if (data.adults !== undefined) out.num_adults = data.adults;
    if (data.children !== undefined) out.num_children = data.children;
    if (data.status !== undefined) out.status = data.status;
    if (data.notes !== undefined) out.special_requests = data.notes;
    return out;
}

export const getBookings        = (token: string)                                   => request('GET',    '/bookings',                 null, token);
export const getBooking         = (id: number, token: string)                       => request('GET',    `/bookings/${id}`,           null, token);
export const createBooking      = (data: BookingData, token: string)                => request('POST',   '/bookings',                 mapBookingPayload(data), token);
export const updateBooking      = (id: number, data: BookingUpdateData, token: string) => request('PUT',   `/bookings/${id}`,           mapBookingUpdatePayload(data), token);
export const deleteBooking      = (id: number, token: string)                       => request('DELETE', `/bookings/${id}`,           null, token);
export const checkIn            = (id: number, token: string)                       => request('POST',   `/bookings/${id}/check-in`,  null, token);
export const checkOut           = (id: number, token: string)                       => request('POST',   `/bookings/${id}/check-out`, null, token);
export const getInvoice         = (id: number, token: string)                       => request('GET',    `/bookings/${id}/invoice`,   null, token);
export const getAvailableRooms  = (token: string)                                   => request('GET',    '/available-rooms',          null, token);
export const getBookingCalendar = (token: string)                                   => request('GET',    '/booking-calendar',         null, token);

// ─── Housekeeping ─────────────────────────────────────────────────────────────

export const getHousekeepingTasks   = (token: string)                                           => request('GET',    '/housekeeping-tasks',       null, token);
export const getHousekeepingTask    = (id: number, token: string)                               => request('GET',    `/housekeeping-tasks/${id}`, null, token);
export const createHousekeepingTask = (data: HousekeepingTaskData, token: string)               => request('POST',   '/housekeeping-tasks',       data, token);
export const updateHousekeepingTask = (id: number, data: HousekeepingTaskData, token: string)   => request('PUT',    `/housekeeping-tasks/${id}`, data, token);
export const deleteHousekeepingTask = (id: number, token: string)                               => request('DELETE', `/housekeeping-tasks/${id}`, null, token);

// ─── Payments ─────────────────────────────────────────────────────────────────

export const getPayments   = (token: string)                                  => request('GET',    '/payments',       null, token);
export const getPayment    = (id: number, token: string)                      => request('GET',    `/payments/${id}`, null, token);
export const createPayment = (data: PaymentData, token: string)               => request('POST',   '/payments',       data, token);
export const updatePayment = (id: number, data: PaymentData, token: string)   => request('PUT',    `/payments/${id}`, data, token);
export const deletePayment = (id: number, token: string)                      => request('DELETE', `/payments/${id}`, null, token);

// ─── Rate Overrides (Admin Only) ──────────────────────────────────────────────

export const getRateOverrides   = (token: string)                                       => request('GET',    '/rate-overrides',       null, token);
export const getRateOverride    = (id: number, token: string)                           => request('GET',    `/rate-overrides/${id}`, null, token);
export const createRateOverride = (data: RateOverrideData, token: string)               => request('POST',   '/rate-overrides',       data, token);
export const updateRateOverride = (id: number, data: RateOverrideData, token: string)   => request('PUT',    `/rate-overrides/${id}`, data, token);
export const deleteRateOverride = (id: number, token: string)                           => request('DELETE', `/rate-overrides/${id}`, null, token);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = (token: string) => request('GET', '/dashboard/stats', null, token);

// ─── Reports (Admin Only) ─────────────────────────────────────────────────────

export const getRevenueReport         = (token: string) => request('GET', '/reports/revenue',          null, token);
export const getBookingsReport        = (token: string) => request('GET', '/reports/bookings',         null, token);
export const getOccupancyReport       = (token: string) => request('GET', '/reports/occupancy',        null, token);
export const getMonthlyRevenueReport  = (token: string) => request('GET', '/reports/monthly-revenue',  null, token);
export const getMonthlyBookingsReport = (token: string) => request('GET', '/reports/monthly-bookings', null, token);

// ─── M-Pesa ───────────────────────────────────────────────────────────────────

export const initiateMpesa = (data: MpesaData, token: string) => request('POST', '/mpesa/initiate', data, token);
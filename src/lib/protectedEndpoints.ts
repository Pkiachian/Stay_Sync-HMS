import api from './api';

export type DashboardStatsResponse = {
  rooms: {
    total: number;
    occupied: number;
    available: number;
    cleaning: number;
    occupancy_rate: number;
  };
  today: {
    check_ins: number;
    check_outs: number;
    revenue: number;
  };
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
};

export type ApiRoom = {
  id: number;
  room_number: string;
  floor: number;
  status: string;
  room_type?: {
    id: number;
    name: string;
    base_rate?: number;
  };
  roomType?: {
    id: number;
    name: string;
    base_rate?: number;
  };
};

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
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  room?: ApiRoom;
};

export type ApiGuest = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  country?: string;
  id_number?: string;
  address?: string;
  total_stays?: number;
  bookings?: ApiBooking[];
};

export type ApiHousekeepingTask = {
  id: number;
  priority: 'low' | 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  updated_at?: string;
  room?: ApiRoom;
  assignee?: {
    id: number;
    name: string;
  };
};

export type TapeChartResponse = {
  rooms: Array<{
    id: number;
    room_number: string;
    room_type: string;
    floor: number;
    bookings: Array<{
      id: number;
      guest_name: string;
      check_in: string;
      check_out: string;
      status: string;
      color: string;
    }>;
  }>;
  date_range: string[];
};

export function fetchDashboardStats() {
  return api.get<DashboardStatsResponse>('/dashboard/stats');
}

export function fetchRooms(params?: Record<string, string | number>) {
  return api.get<PaginatedResponse<ApiRoom> | ApiRoom[]>('/rooms', { params });
}

export function fetchGuests(params?: Record<string, string | number>) {
  return api.get<PaginatedResponse<ApiGuest> | ApiGuest[]>('/guests', { params });
}

export function fetchBookings(params?: Record<string, string | number>) {
  return api.get<PaginatedResponse<ApiBooking> | ApiBooking[]>('/bookings', { params });
}

export function fetchTapeChart(startDate: string, endDate: string) {
  return api.get<TapeChartResponse>('/tape-chart', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });
}

export function fetchHousekeepingTasks(params?: Record<string, string | number>) {
  return api.get<PaginatedResponse<ApiHousekeepingTask> | ApiHousekeepingTask[]>('/housekeeping/tasks', { params });
}

export function updateHousekeepingTask(taskId: number, data: Record<string, unknown>) {
  return api.patch<ApiHousekeepingTask>(`/housekeeping/tasks/${taskId}`, data);
}

export function completeHousekeepingTask(taskId: number) {
  return api.patch<ApiHousekeepingTask>(`/housekeeping/tasks/${taskId}/complete`);
}

export function fetchReports(startDate: string, endDate: string, groupBy = 'day') {
  return api.get('/reports', {
    params: {
      start_date: startDate,
      end_date: endDate,
      group_by: groupBy,
    },
  });
}

export function fetchSettings() {
  return api.get<Record<string, string>>('/settings');
}

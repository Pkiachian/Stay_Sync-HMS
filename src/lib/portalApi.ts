import api from './api';

export type PortalRoomType = {
  id: number;
  name: string;
  slug?: string;
  base_price: string | number;
  max_occupancy: number;
  description?: string;
  amenities?: string[];
};

export type PortalAvailableRoom = {
  id: number;
  room_number: string;
  floor: number;
  status: string;
  is_active: boolean;
  room_type?: PortalRoomType;
  roomType?: PortalRoomType;
};

export type PortalBooking = {
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
  room?: PortalAvailableRoom;
};

export function fetchPortalRoomTypes() {
  return api.get<{ success: boolean; data: PortalRoomType[] }>('/portal/room-types');
}

export function fetchPortalAvailableRooms(params: {
  checkIn: string;
  checkOut: string;
  roomTypeId?: number;
}) {
  return api.get<{ success: boolean; data: PortalAvailableRoom[] }>('/portal/available-rooms', {
    params: {
      check_in_date: params.checkIn,
      check_out_date: params.checkOut,
      room_type_id: params.roomTypeId,
    },
  });
}

export function createPortalBooking(payload: Record<string, unknown>) {
  return api.post<{ success: boolean; data: PortalBooking }>('/portal/bookings', payload);
}

export function lookupPortalBooking(params: { reference: string; lastName: string }) {
  return api.get<{ success: boolean; data: PortalBooking }>('/portal/bookings/lookup', {
    params: { reference: params.reference, last_name: params.lastName },
  });
}

export function cancelPortalBooking(id: number, lastName: string) {
  return api.post<{ success: boolean; data: PortalBooking }>(`/portal/bookings/${id}/cancel`, {
    last_name: lastName,
  });
}

export type MpesaStkResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

export function payPortalDeposit(payload: { phone: string; amount: number; reference: string }) {
  return api.post<{ success: boolean; data: MpesaStkResponse }>('/portal/pay', payload);
}

export function buildPortalInvoiceUrl(id: number, lastName: string, type: 'invoice' | 'receipt' = 'invoice') {
  return `${api.defaults.baseURL}/portal/bookings/${id}/invoice?type=${type}&last_name=${encodeURIComponent(lastName)}`;
}

export type ServiceRequestType = 'taxi' | 'airport' | 'wakeup' | 'laundry' | 'housekeeping' | 'tour';

export type ServiceRequestPayload = {
  service_type: ServiceRequestType;
  guest_name: string;
  room_number?: string;
  phone?: string;
  email?: string;
  preferred_at?: string;
  details?: string;
};

export function submitServiceRequest(payload: ServiceRequestPayload) {
  return api.post<{ success: boolean; data: { reference: string; status: string } }>('/portal/service-requests', payload);
}

export type PortalLoyaltyResponse = {
  guest: { first_name: string; last_name: string; loyalty_tier: string | null };
  points: number;
  stays: number;
  tier: string;
  next_tier: { name: string; from: number } | null;
  history: Array<{
    booking_reference: string;
    check_in_date: string;
    check_out_date: string;
    room_number?: string;
    total_price: number;
    status: string;
  }>;
};

export function lookupPortalLoyalty(phone: string) {
  return api.get<{ success: boolean; data: PortalLoyaltyResponse }>('/portal/loyalty', {
    params: { phone },
  });
}

export type RoomServiceMenuItem = {
  id: number;
  category: string;
  name: string;
  description: string | null;
  price: string;
  is_active: boolean;
};

export type RoomServiceOrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  item_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
};

export type RoomServiceOrder = {
  id: number;
  reference: string;
  booking_id: number;
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
  items: RoomServiceOrderItem[];
};

export type RoomServiceMenuResponse = Record<string, RoomServiceMenuItem[]>;

export function fetchPortalRoomServiceMenu() {
  return api.get<{ success: boolean; data: RoomServiceMenuResponse }>('/portal/room-service/menu');
}

export function placePortalRoomServiceOrder(payload: {
  reference: string;
  last_name: string;
  guest_name: string;
  room_number?: string;
  phone?: string;
  notes?: string;
  items: Array<{ menu_item_id: number; quantity: number }>;
}) {
  return api.post<{ success: boolean; data: RoomServiceOrder }>('/portal/room-service/orders', payload);
}

export function lookupPortalRoomServiceOrder(params: { reference: string; lastName: string }) {
  return api.get<{ success: boolean; data: RoomServiceOrder }>('/portal/room-service/orders/lookup', {
    params: { reference: params.reference, last_name: params.lastName },
  });
}

export type PortalChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export type PortalChatHandoff = {
  reason: string;
  reference: string;
  id: number;
};

export type PortalChatResponse = {
  reply: string;
  handoff: PortalChatHandoff | null;
};

export function askPortalChat(payload: {
  messages: PortalChatMessage[];
  session_id?: string;
  guest_name?: string;
  room_number?: string;
}) {
  return api.post<{ success: boolean; data: PortalChatResponse }>('/portal/chat', payload);
}

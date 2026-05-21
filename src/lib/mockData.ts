export const mockStats = {
  occupancyRate: 74,
  totalRooms: 120,
  occupiedRooms: 89,
  availableRooms: 31,
  checkInsToday: 15,
  checkOutsToday: 12,
  revenueToday: 245000,
  pendingPayments: 8,
  pendingHousekeeping: 7,
  cleanedToday: 23,
  waitingCleaning: 7,
  activeStaff: 4,
};

export const mockOccupancyWeek = [
  { day: 'Mon', rate: 65 },
  { day: 'Tue', rate: 72 },
  { day: 'Wed', rate: 80 },
  { day: 'Thu', rate: 78 },
  { day: 'Fri', rate: 91 },
  { day: 'Sat', rate: 95 },
  { day: 'Sun', rate: 74 },
];

export const mockMonthlyRevenue = [
  { month: 'Jan', revenue: 1200000 },
  { month: 'Feb', revenue: 980000 },
  { month: 'Mar', revenue: 1450000 },
  { month: 'Apr', revenue: 1100000 },
  { month: 'May', revenue: 1680000 },
  { month: 'Jun', revenue: 1900000 },
];

export const mockRoomStatus = [
  { name: 'Occupied', value: 89, color: '#3b82f6' },
  { name: 'Available', value: 31, color: '#22c55e' },
  { name: 'Cleaning', value: 7, color: '#f59e0b' },
  { name: 'Maintenance', value: 3, color: '#ef4444' },
];

export const mockRecentBookings = [
  { id: 1, guest: 'John Doe', room: '204', type: 'Deluxe King', checkIn: '2026-05-19', checkOut: '2026-05-22', status: 'checked_in', updatedAt: '08:45' },
  { id: 2, guest: 'Mary Ann', room: '105', type: 'Standard King', checkIn: '2026-05-19', checkOut: '2026-05-20', status: 'pending', updatedAt: '09:05' },
  { id: 3, guest: 'James Odhiambo', room: '301', type: 'Suite', checkIn: '2026-05-18', checkOut: '2026-05-21', status: 'checked_in', updatedAt: '09:40' },
  { id: 4, guest: 'Amina Hassan', room: '205', type: 'Deluxe Twin', checkIn: '2026-05-19', checkOut: '2026-05-23', status: 'confirmed', updatedAt: '10:20' },
  { id: 5, guest: 'Peter Otieno', room: '110', type: 'Standard King', checkIn: '2026-05-17', checkOut: '2026-05-19', status: 'checked_out', updatedAt: '11:10' },
];

export const mockArrivals = [
  { id: 1, guest: 'Fatuma Ali', room: '203', time: '14:00', nights: 3 },
  { id: 2, guest: 'David Kamau', room: '307', time: '15:30', nights: 1 },
  { id: 3, guest: 'Sandra Achieng', room: '102', time: '16:00', nights: 5 },
];

export const mockNotifications = [
  { id: 1, type: 'warning', title: 'Late Checkout', message: 'Room 302 - Guest has not checked out', time: '10 min ago' },
  { id: 2, type: 'info', title: 'New Reservation', message: 'Brian Mutua - Room 401, Suite', time: '25 min ago' },
  { id: 3, type: 'error', title: 'Maintenance Request', message: 'Room 215 - AC not working', time: '1 hr ago' },
  { id: 4, type: 'success', title: 'Room Cleaned', message: 'Room 108 is ready for check-in', time: '1 hr ago' },
  { id: 5, type: 'warning', title: 'Low Availability', message: 'Only 5 Standard rooms left tonight', time: '2 hr ago' },
];

export const mockRoomGrid = [
  { number: '101', type: 'Standard', status: 'occupied' },
  { number: '102', type: 'Standard', status: 'available' },
  { number: '103', type: 'Standard', status: 'cleaning' },
  { number: '104', type: 'Standard', status: 'occupied' },
  { number: '105', type: 'Standard', status: 'available' },
  { number: '106', type: 'Standard', status: 'maintenance' },
  { number: '107', type: 'Standard', status: 'occupied' },
  { number: '108', type: 'Standard', status: 'available' },
  { number: '201', type: 'Deluxe', status: 'occupied' },
  { number: '202', type: 'Deluxe', status: 'occupied' },
  { number: '203', type: 'Deluxe', status: 'cleaning' },
  { number: '204', type: 'Deluxe', status: 'occupied' },
  { number: '205', type: 'Deluxe', status: 'available' },
  { number: '206', type: 'Deluxe', status: 'occupied' },
  { number: '301', type: 'Suite', status: 'occupied' },
  { number: '302', type: 'Suite', status: 'occupied' },
  { number: '303', type: 'Suite', status: 'available' },
  { number: '304', type: 'Suite', status: 'maintenance' },
  { number: '401', type: 'Penthouse', status: 'available' },
  { number: '402', type: 'Penthouse', status: 'occupied' },
];

export const mockTapeChartRooms = [
  {
    id: 1, number: '101', floor: 1, type_name: 'Standard King', status: 'occupied',
    bookings: [
      { id: 101, reference: 'SS-001', guest_name: 'James Odhiambo', room_id: 1, check_in: '2026-05-13', check_out: '2026-05-17', status: 'checked_in', nights: 4 },
      { id: 102, reference: 'SS-002', guest_name: 'Mary Wanjiku', room_id: 1, check_in: '2026-05-20', check_out: '2026-05-23', status: 'confirmed', nights: 3 },
    ],
  },
  {
    id: 2, number: '102', floor: 1, type_name: 'Standard King', status: 'available',
    bookings: [
      { id: 103, reference: 'SS-003', guest_name: 'Sandra Achieng', room_id: 2, check_in: '2026-05-15', check_out: '2026-05-20', status: 'confirmed', nights: 5 },
    ],
  },
  {
    id: 3, number: '201', floor: 2, type_name: 'Deluxe King', status: 'available',
    bookings: [
      { id: 104, reference: 'SS-004', guest_name: 'Brian Mutua', room_id: 3, check_in: '2026-05-14', check_out: '2026-05-16', status: 'checked_in', nights: 2 },
      { id: 105, reference: 'SS-005', guest_name: 'Aisha Mohamed', room_id: 3, check_in: '2026-05-22', check_out: '2026-05-27', status: 'confirmed', nights: 5 },
    ],
  },
  {
    id: 4, number: '202', floor: 2, type_name: 'Deluxe King', status: 'dirty',
    bookings: [
      { id: 106, reference: 'SS-006', guest_name: 'Peter Otieno', room_id: 4, check_in: '2026-05-15', check_out: '2026-05-19', status: 'confirmed', nights: 4 },
    ],
  },
  {
    id: 5, number: '203', floor: 2, type_name: 'Deluxe Twin', status: 'available',
    bookings: [
      { id: 107, reference: 'SS-007', guest_name: 'Fatuma Ali', room_id: 5, check_in: '2026-05-15', check_out: '2026-05-18', status: 'checked_in', nights: 3 },
      { id: 108, reference: 'SS-008', guest_name: 'John Kamau', room_id: 5, check_in: '2026-05-25', check_out: '2026-05-30', status: 'confirmed', nights: 5 },
    ],
  },
  {
    id: 6, number: '301', floor: 3, type_name: 'Suite', status: 'occupied',
    bookings: [
      { id: 109, reference: 'SS-009', guest_name: 'Grace Wanjiru', room_id: 6, check_in: '2026-05-13', check_out: '2026-05-18', status: 'checked_in', nights: 5 },
      { id: 110, reference: 'SS-010', guest_name: 'David Kimani', room_id: 6, check_in: '2026-05-21', check_out: '2026-05-25', status: 'confirmed', nights: 4 },
    ],
  },
  {
    id: 7, number: '302', floor: 3, type_name: 'Suite', status: 'available',
    bookings: [
      { id: 111, reference: 'SS-011', guest_name: 'Amina Hassan', room_id: 7, check_in: '2026-05-17', check_out: '2026-05-22', status: 'confirmed', nights: 5 },
    ],
  },
  {
    id: 8, number: '401', floor: 4, type_name: 'Penthouse', status: 'available',
    bookings: [
      { id: 112, reference: 'SS-012', guest_name: 'Robert Mwangi', room_id: 8, check_in: '2026-05-20', check_out: '2026-05-25', status: 'confirmed', nights: 5 },
    ],
  },
];

export const mockHousekeepingTasks = [
  { id: 1, room: '101', type: 'Standard King', floor: 1, status: 'dirty', priority: 'high', assignedTo: 'Jane Mwende', notes: 'Guest checked out', updatedAt: '08:30' },
  { id: 2, room: '203', type: 'Deluxe Twin', floor: 2, status: 'cleaning', priority: 'high', assignedTo: 'Peter Njoroge', notes: 'Arriving guest at 14:00', updatedAt: '09:15' },
  { id: 3, room: '302', type: 'Suite', floor: 3, status: 'dirty', priority: 'normal', assignedTo: null, notes: 'Late checkout', updatedAt: '10:00' },
  { id: 4, room: '108', type: 'Standard King', floor: 1, status: 'inspected', priority: 'low', assignedTo: 'Jane Mwende', notes: 'Ready for check-in', updatedAt: '10:30' },
  { id: 5, room: '215', type: 'Deluxe King', floor: 2, status: 'dirty', priority: 'high', assignedTo: null, notes: 'Maintenance done, needs clean', updatedAt: '11:00' },
  { id: 6, room: '304', type: 'Suite', floor: 3, status: 'cleaning', priority: 'normal', assignedTo: 'Alice Waweru', notes: 'VIP arrival at 15:00', updatedAt: '11:15' },
];

export const mockGuests = [
  { id: 1, name: 'James Odhiambo', email: 'james@email.com', phone: '+254712345678', nationality: 'Kenyan', idNumber: 'KE123456', visits: 3, totalSpent: 45000, lastVisit: '2026-05-13', status: 'checked_in' },
  { id: 2, name: 'Amina Hassan', email: 'amina@email.com', phone: '+254723456789', nationality: 'Somali', idNumber: 'SO789012', visits: 1, totalSpent: 12000, lastVisit: '2026-05-19', status: 'confirmed' },
  { id: 3, name: 'Brian Mutua', email: 'brian@email.com', phone: '+254734567890', nationality: 'Kenyan', idNumber: 'KE234567', visits: 5, totalSpent: 89000, lastVisit: '2026-05-14', status: 'checked_in' },
  { id: 4, name: 'Grace Wanjiru', email: 'grace@email.com', phone: '+254745678901', nationality: 'Kenyan', idNumber: 'KE345678', visits: 2, totalSpent: 34000, lastVisit: '2026-05-13', status: 'checked_in' },
  { id: 5, name: 'Peter Otieno', email: 'peter@email.com', phone: '+254756789012', nationality: 'Kenyan', idNumber: 'KE456789', visits: 4, totalSpent: 67000, lastVisit: '2026-05-17', status: 'checked_out' },
  { id: 6, name: 'Fatuma Ali', email: 'fatuma@email.com', phone: '+254767890123', nationality: 'Tanzanian', idNumber: 'TZ567890', visits: 1, totalSpent: 18000, lastVisit: '2026-05-15', status: 'checked_in' },
];

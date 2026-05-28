export const APP_NAME = 'StaySync';

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-500',
  checked_in: 'bg-green-500',
  checked_out: 'bg-gray-400',
  cancelled: 'bg-red-400',
  no_show: 'bg-orange-400',
  pending: 'bg-yellow-400',
};

export const TAPE_CHART_DAYS = 14;

export const NAV_LINKS = [
  { label: 'Dashboard',    path: '/'             },
  { label: 'Tape Chart',   path: '/tape-chart'   },
  { label: 'Bookings',     path: '/bookings'      },
  { label: 'Housekeeping', path: '/housekeeping' },
  { label: 'Guests',       path: '/guests'        },
  { label: 'Reports',      path: '/reports'       },
] as const;
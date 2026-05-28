# API Documentation

All protected endpoints require Sanctum authentication. Role access is enforced by `role` middleware.

## Auth

- `POST /api/register` - create a user. Body: `name`, `email`, `password`, optional `role`.
- `POST /api/login` - authenticate. Body: `email`, `password`.
- `GET /api/me` - current authenticated user.
- `POST /api/logout` - revoke the current token.

## Rooms

- `GET /api/room-types` - list room types with room counts.
- `POST /api/room-types` - create a room type.
- `GET /api/room-types/{roomType}` - view a room type.
- `PUT/PATCH /api/room-types/{roomType}` - update a room type.
- `DELETE /api/room-types/{roomType}` - delete a room type if no rooms exist.
- `GET /api/rooms` - list rooms with filters: `status`, `room_type`, `floor`.
- `POST /api/rooms` - create a room.
- `GET /api/rooms/{room}` - view room details with logs and housekeeping tasks.
- `PUT/PATCH /api/rooms/{room}` - update a room.
- `PATCH /api/rooms/{room}/status` - change status and create a room status log.
- `DELETE /api/rooms/{room}` - delete a room if no bookings exist.
- `GET /api/rooms/availability?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD&room_type_id=1` - available rooms.

## Dashboard

- `GET /api/dashboard/stats` - total/occupied/available/cleaning rooms, arrivals, departures, occupancy rate, and revenue.

## Guests

- `GET /api/guests?search=value` - searchable, paginated guest list.
- `POST /api/guests` - create a guest.
- `GET /api/guests/{guest}` - guest profile with booking history.
- `PUT/PATCH /api/guests/{guest}` - update a guest.
- `DELETE /api/guests/{guest}` - delete if no booking history exists.

## Bookings

- `GET /api/bookings` - paginated bookings with filters: `status`, `guest`, `room`, `start_date`, `end_date`.
- `POST /api/bookings` - create a booking with `guest_id` or nested `guest`, `room_id`, dates, guests, source, requests, and optional addons.
- `GET /api/bookings/{booking}` - full booking detail with guest, room, addons, folio charges, and payments.
- `PUT/PATCH /api/bookings/{booking}` - modify room/dates/details and recalculate price.
- `PATCH /api/bookings/{booking}/check-in` - mark checked in, occupy room, and auto-post room charges.
- `PATCH /api/bookings/{booking}/check-out` - mark checked out, set room cleaning, and create housekeeping task.
- `PATCH /api/bookings/{booking}/cancel` - cancel with optional reason.
- `PATCH /api/bookings/{booking}/no-show` - mark no-show.
- `GET /api/tape-chart?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - room/date booking grid payload.

## Housekeeping

- `GET /api/housekeeping/tasks` - list tasks with `status`, `priority`, `assigned_to`, and `floor` filters.
- `POST /api/housekeeping/tasks` - create a task.
- `PATCH /api/housekeeping/tasks/{task}` - update status, priority, assignee, or notes.
- `PATCH /api/housekeeping/tasks/{task}/complete` - complete task and mark room available.

## Folio And Payments

- `GET /api/bookings/{booking}/folio` - charges, payments, and balance summary.
- `POST /api/bookings/{booking}/charges` - add charge.
- `DELETE /api/folio-charges/{charge}` - void a charge.
- `GET /api/bookings/{booking}/payments` - list payments.
- `POST /api/bookings/{booking}/payments` - record payment.
- `GET /api/bookings/{booking}/invoice` - invoice view or PDF when dompdf is installed.

## Rates

- `GET /api/rates?room_type_id=1&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - calculated and overridden rates.
- `POST /api/rates/overrides` - set or update a rate override.
- `DELETE /api/rate-overrides/{rateOverride}` - remove override.

## Reports And Settings

- `GET /api/reports` - combined report payload.
- `GET /api/reports/occupancy` - daily occupancy.
- `GET /api/reports/revenue?group_by=day|week|month` - revenue breakdown.
- `GET /api/reports/room-type-performance` - revenue and bookings by room type.
- `GET /api/reports/guest-statistics` - top guests, repeat guest count, average stay length.
- `GET /api/settings` - key/value settings.
- `PUT /api/settings` - batch update with `{ "settings": { "tax_rate": "0.16" } }`.

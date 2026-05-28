# Database Schema

The current SQL source of truth is `backend/database/sql/staysync_v1.sql`.

## Core Tables

- `users` - auth users with a single `role` enum and `is_active` flag.
- `personal_access_tokens` - Sanctum token storage.
- `room_types` - type name, slug, base rate, occupancy, description, and amenities JSON.
- `rooms` - room number, floor, room type, status, and active flag.
- `guests` - profile, identity, contact, loyalty, and stay count fields.
- `bookings` - guest, room, room type, date range, actual arrival/departure, status, source, pricing, and cancellation reason.
- `booking_addons` - optional booking extras with quantity and pricing.
- `folio_charges` - room/POS charges with void metadata.
- `payments` - booking payments with method, reference, status, and paid date.
- `room_status_logs` - audit trail for every room status change.
- `housekeeping_tasks` - cleaning tasks, assignment, priority, status, and completion timestamp.
- `rate_overrides` - per-room-type manual rate overrides by date.
- `settings` - key/value hotel configuration, including tax and currency.
- `activity_logs` - audit events for critical API actions.

## Relationships

- `room_types` has many `rooms` and `rate_overrides`.
- `rooms` belongs to `room_types` and has many `bookings`, `room_status_logs`, and `housekeeping_tasks`.
- `guests` has many `bookings`.
- `bookings` belongs to `guests`, `rooms`, and `room_types`; it has many `booking_addons`, `folio_charges`, and `payments`.
- `folio_charges.posted_by` and `folio_charges.voided_by` reference `users`.
- `housekeeping_tasks.assigned_to` references `users`.
- `activity_logs.user_id` references `users`.

## Important Indexes And Constraints

- Unique: `users.email`, `room_types.name`, `room_types.slug`, `rooms.room_number`, `guests.email`, `bookings.booking_reference`.
- Booking availability uses `bookings_room_dates_idx` on `room_id`, `check_in_date`, and `check_out_date`.
- One rate override per room type and date via `rate_overrides_unique_day`.

## Migration Note

The backend directory is not yet a complete Laravel app. When it is converted, create migrations matching `staysync_v1.sql` or import the SQL directly for local development.

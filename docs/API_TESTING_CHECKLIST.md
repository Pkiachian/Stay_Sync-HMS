# StaySync-HMS API Testing Checklist

Base URL: `http://127.0.0.1:8000/api`

## Auth

- `POST /register` creates a staff user and returns `success`, `message`, `data.user`, and `data.token`.
- `POST /register` with duplicate email returns `422` and `errors.email`.
- `POST /login` with valid credentials returns a bearer token.
- `POST /login` with wrong password returns `401`.
- Protected endpoints without bearer token return `401` and `Unauthenticated`.
- `POST /logout` with bearer token returns success and invalidates the current token.

## RBAC

- Staff can access operational read/write routes for guests, bookings, payments, housekeeping, available rooms, booking calendar, and invoices.
- Staff cannot create/update/delete rooms, room types, rate overrides, or reports.
- Admin can access admin-only routes.
- Unknown roles return `403` on role-protected routes.

## Rooms

- Admin can create a room with valid `room_type_id`, unique `room_number`, `floor`, `status`, and `is_active`.
- Duplicate `room_number` returns `422`.
- Invalid `room_type_id` returns `422`.
- Staff can list and show rooms.
- Admin can update room status and delete rooms.
- Missing room returns standardized `404`.

## Room Types

- Admin can create, list, show, update, and delete room types.
- Duplicate slug returns `422`.
- Missing `base_price` or invalid `max_occupancy` returns `422`.
- Staff can list/show room types but cannot mutate them.

## Guests

- Authenticated staff/admin can create, list, show, update, and delete guests.
- Invalid email returns `422`.
- Duplicate email returns `422`.
- Missing first or last name returns `422`.
- Missing guest returns standardized `404`.

## Bookings

- Booking create requires valid guest, room, room type, check-in, check-out, and adult count.
- `check_out_date` before or equal to `check_in_date` returns `422`.
- Room type must match selected room.
- Inactive or unavailable room returns `409`.
- Overlapping booking returns `409`.
- Adjacent bookings are allowed when one checkout equals the next check-in.
- Updating booking dates checks conflicts against other bookings.
- `POST /bookings/{id}/check-in` only succeeds for `confirmed`.
- `POST /bookings/{id}/check-out` only succeeds for `checked_in`.
- `GET /available-rooms` excludes fully-contained overlap ranges.

## Payments

- Payment create requires valid `booking_id`, `amount`, `payment_method`, and `payment_date`.
- Invalid payment method returns `422`.
- Payment update works for amount, method, reference, status, and date.
- Missing payment returns standardized `404`.

## API Response Contract

- Success responses use `success: true`, `message`, and `data`.
- Validation failures use `success: false`, `message: Validation failed`, and `errors`.
- Not found responses use `success: false` and `message: Resource not found`.
- Forbidden responses use `success: false` and `message: Access denied`.
- Unauthenticated responses use `success: false` and `message: Unauthenticated`.

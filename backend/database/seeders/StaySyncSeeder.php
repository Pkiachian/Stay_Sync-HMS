<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Guest;
use App\Models\HousekeepingTask;
use App\Models\Payment;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StaySyncSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $roomTypes = $this->seedRoomTypes();
            $rooms = $this->seedRooms($roomTypes);
            $guests = $this->seedGuests();
            $this->seedBookings($guests, $rooms, $roomTypes);
            $this->seedHousekeepingTasks($rooms);
            $this->seedPayments();
        });
    }

    /**
     * @return array<string, RoomType>
     */
    private function seedRoomTypes(): array
    {
        $definitions = [
            ['name' => 'Standard King', 'slug' => 'standard-king', 'base_price' => 8000, 'max_occupancy' => 2, 'description' => 'Comfortable king-bed room with city views.', 'amenities' => ['Wi-Fi', 'TV', 'Air conditioning']],
            ['name' => 'Deluxe King', 'slug' => 'deluxe-king', 'base_price' => 12000, 'max_occupancy' => 2, 'description' => 'Spacious deluxe room with premium amenities.', 'amenities' => ['Wi-Fi', 'TV', 'Mini-bar', 'Balcony']],
            ['name' => 'Deluxe Twin', 'slug' => 'deluxe-twin', 'base_price' => 12000, 'max_occupancy' => 2, 'description' => 'Two-bed deluxe room ideal for friends or colleagues.', 'amenities' => ['Wi-Fi', 'TV', 'Work desk']],
            ['name' => 'Suite', 'slug' => 'suite', 'base_price' => 18000, 'max_occupancy' => 3, 'description' => 'Separate living area with king bed and lounge.', 'amenities' => ['Wi-Fi', 'TV', 'Living room', 'Mini-bar']],
            ['name' => 'Penthouse', 'slug' => 'penthouse', 'base_price' => 30000, 'max_occupancy' => 4, 'description' => 'Top-floor penthouse with panoramic views.', 'amenities' => ['Wi-Fi', 'TV', 'Jacuzzi', 'Terrace', 'Lounge']],
        ];

        $out = [];
        foreach ($definitions as $row) {
            $out[$row['slug']] = RoomType::updateOrCreate(['slug' => $row['slug']], $row);
        }
        return $out;
    }

    /**
     * @param array<string, RoomType> $roomTypes
     * @return array<int, Room>
     */
    private function seedRooms(array $roomTypes): array
    {
        $rooms = [
            // floor 1 - Standard King
            ['room_number' => '101', 'floor' => 1, 'room_type' => 'standard-king', 'status' => 'available'],
            ['room_number' => '102', 'floor' => 1, 'room_type' => 'standard-king', 'status' => 'available'],
            ['room_number' => '103', 'floor' => 1, 'room_type' => 'standard-king', 'status' => 'available'],
            ['room_number' => '110', 'floor' => 1, 'room_type' => 'standard-king', 'status' => 'available'],
            // floor 2 - Deluxe King / Twin
            ['room_number' => '201', 'floor' => 2, 'room_type' => 'deluxe-king', 'status' => 'available'],
            ['room_number' => '202', 'floor' => 2, 'room_type' => 'deluxe-king', 'status' => 'available'],
            ['room_number' => '203', 'floor' => 2, 'room_type' => 'deluxe-twin', 'status' => 'available'],
            ['room_number' => '204', 'floor' => 2, 'room_type' => 'deluxe-twin', 'status' => 'available'],
            ['room_number' => '205', 'floor' => 2, 'room_type' => 'deluxe-twin', 'status' => 'available'],
            // floor 3 - Suites
            ['room_number' => '301', 'floor' => 3, 'room_type' => 'suite', 'status' => 'available'],
            ['room_number' => '302', 'floor' => 3, 'room_type' => 'suite', 'status' => 'available'],
            // floor 4 - Penthouse
            ['room_number' => '401', 'floor' => 4, 'room_type' => 'penthouse', 'status' => 'available'],
        ];

        $out = [];
        foreach ($rooms as $row) {
            $type = $roomTypes[$row['room_type']] ?? null;
            if (!$type) continue;
            $out[] = Room::updateOrCreate(
                ['room_number' => $row['room_number']],
                [
                    'floor' => $row['floor'],
                    'room_type_id' => $type->id,
                    'status' => $row['status'],
                    'is_active' => true,
                ],
            );
        }
        return $out;
    }

    /**
     * @return array<int, Guest>
     */
    private function seedGuests(): array
    {
        $guests = [
            ['first_name' => 'James', 'last_name' => 'Odhiambo', 'email' => 'james.odhiambo@example.com', 'phone' => '+254712345678', 'gender' => 'male', 'nationality' => 'Kenyan', 'id_type' => 'national_id', 'id_number' => 'KE123456', 'address' => 'Westlands', 'city' => 'Nairobi', 'country' => 'Kenya', 'total_stays' => 3, 'loyalty_tier' => 'gold'],
            ['first_name' => 'Amina', 'last_name' => 'Hassan', 'email' => 'amina.hassan@example.com', 'phone' => '+254723456789', 'gender' => 'female', 'nationality' => 'Somali', 'id_type' => 'passport', 'id_number' => 'SO789012', 'address' => 'Kilimani', 'city' => 'Nairobi', 'country' => 'Kenya', 'total_stays' => 1],
            ['first_name' => 'Brian', 'last_name' => 'Mutua', 'email' => 'brian.mutua@example.com', 'phone' => '+254734567890', 'gender' => 'male', 'nationality' => 'Kenyan', 'id_type' => 'national_id', 'id_number' => 'KE234567', 'address' => 'Nyali', 'city' => 'Mombasa', 'country' => 'Kenya', 'total_stays' => 5, 'loyalty_tier' => 'platinum'],
            ['first_name' => 'Grace', 'last_name' => 'Wanjiru', 'email' => 'grace.wanjiru@example.com', 'phone' => '+254745678901', 'gender' => 'female', 'nationality' => 'Kenyan', 'id_type' => 'national_id', 'id_number' => 'KE345678', 'address' => 'Lavington', 'city' => 'Nairobi', 'country' => 'Kenya', 'total_stays' => 2],
            ['first_name' => 'Peter', 'last_name' => 'Otieno', 'email' => 'peter.otieno@example.com', 'phone' => '+254756789012', 'gender' => 'male', 'nationality' => 'Kenyan', 'id_type' => 'national_id', 'id_number' => 'KE456789', 'address' => 'Kisumu CBD', 'city' => 'Kisumu', 'country' => 'Kenya', 'total_stays' => 4],
            ['first_name' => 'Fatuma', 'last_name' => 'Ali', 'email' => 'fatuma.ali@example.com', 'phone' => '+254767890123', 'gender' => 'female', 'nationality' => 'Tanzanian', 'id_type' => 'passport', 'id_number' => 'TZ567890', 'address' => 'Masaki', 'city' => 'Dar es Salaam', 'country' => 'Tanzania', 'total_stays' => 1],
            ['first_name' => 'David', 'last_name' => 'Kimani', 'email' => 'david.kimani@example.com', 'phone' => '+254778901234', 'gender' => 'male', 'nationality' => 'Kenyan', 'id_type' => 'national_id', 'id_number' => 'KE678901', 'address' => 'Karen', 'city' => 'Nairobi', 'country' => 'Kenya', 'total_stays' => 2, 'loyalty_tier' => 'silver'],
            ['first_name' => 'Sandra', 'last_name' => 'Achieng', 'email' => 'sandra.achieng@example.com', 'phone' => '+254789012345', 'gender' => 'female', 'nationality' => 'Kenyan', 'id_type' => 'national_id', 'id_number' => 'KE789012', 'address' => 'Runda', 'city' => 'Nairobi', 'country' => 'Kenya', 'total_stays' => 1],
        ];

        $out = [];
        foreach ($guests as $row) {
            $out[] = Guest::updateOrCreate(['email' => $row['email']], $row);
        }
        return $out;
    }

    /**
     * @param array<int, Guest> $guests
     * @param array<int, Room> $rooms
     * @param array<string, RoomType> $roomTypes
     */
    private function seedBookings(array $guests, array $rooms, array $roomTypes): void
    {
        $today = new \DateTimeImmutable('today');
        $bookings = [
            // Past - checked out
            ['guest' => 'james.odhiambo@example.com', 'room_number' => '301', 'offset' => -10, 'nights' => 5, 'status' => 'checked_out', 'adults' => 2, 'children' => 0, 'special' => 'High floor preferred'],
            ['guest' => 'grace.wanjiru@example.com', 'room_number' => '110', 'offset' => -8, 'nights' => 4, 'status' => 'checked_out', 'adults' => 1, 'children' => 0, 'special' => 'Late checkout'],
            // Current - checked in (offset 0 = today)
            ['guest' => 'brian.mutua@example.com', 'room_number' => '401', 'offset' => -2, 'nights' => 5, 'status' => 'checked_in', 'adults' => 2, 'children' => 1, 'special' => 'VIP - prepare welcome package'],
            ['guest' => 'sandra.achieng@example.com', 'room_number' => '202', 'offset' => -1, 'nights' => 3, 'status' => 'checked_in', 'adults' => 1, 'children' => 0, 'special' => ''],
            // Today's arrivals
            ['guest' => 'david.kimani@example.com', 'room_number' => '205', 'offset' => 0, 'nights' => 4, 'status' => 'confirmed', 'adults' => 2, 'children' => 0, 'special' => 'Airport pickup needed'],
            // Future - confirmed
            ['guest' => 'peter.otieno@example.com', 'room_number' => '103', 'offset' => 3, 'nights' => 2, 'status' => 'confirmed', 'adults' => 1, 'children' => 0, 'special' => ''],
            ['guest' => 'fatuma.ali@example.com', 'room_number' => '302', 'offset' => 5, 'nights' => 4, 'status' => 'pending', 'adults' => 2, 'children' => 0, 'special' => 'Late check-in after 10pm'],
            // Future
            ['guest' => 'amina.hassan@example.com', 'room_number' => '203', 'offset' => 8, 'nights' => 3, 'status' => 'confirmed', 'adults' => 1, 'children' => 0, 'special' => 'Baby cot needed'],
        ];

        $guestByEmail = collect($guests)->keyBy('email');
        $roomByNumber = collect($rooms)->keyBy('room_number');
        $adminUser = User::query()->first();

        foreach ($bookings as $row) {
            $guest = $guestByEmail->get($row['guest']);
            $room = $roomByNumber->get($row['room_number']);
            if (!$guest || !$room) continue;

            $roomTypeId = $room->room_type_id;
            $roomType = collect($roomTypes)->first(fn ($rt) => $rt->id === $roomTypeId);
            $checkIn = $today->modify("{$row['offset']} days");
            $checkOut = $checkIn->modify("+{$row['nights']} days");
            $nights = (int) $row['nights'];
            $basePrice = (float) ($roomType?->base_price ?? 0);
            $subtotal = $basePrice * $nights;
            $tax = round($subtotal * 0.10, 2);
            $total = $subtotal + $tax;

            $reference = 'BK-' . strtoupper(substr(md5($guest->id . '|' . $room->id . '|' . $checkIn->format('Y-m-d')), 0, 6));
            $attributes = [
                'guest_id' => $guest->id,
                'room_id' => $room->id,
                'room_type_id' => $roomTypeId,
                'check_in_date' => $checkIn->format('Y-m-d'),
                'check_out_date' => $checkOut->format('Y-m-d'),
                'num_adults' => (int) $row['adults'],
                'num_children' => (int) $row['children'],
                'status' => $row['status'],
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'discount_amount' => 0,
                'total_price' => $total,
                'special_requests' => $row['special'] ?: null,
                'source' => 'direct',
            ];
            if ($adminUser) {
                $attributes['created_by'] = $adminUser->id;
            }
            if ($row['status'] === 'checked_in') {
                $attributes['actual_check_in'] = $checkIn->setTime(14, 0);
            }
            if ($row['status'] === 'checked_out') {
                $attributes['actual_check_in'] = $checkIn->setTime(14, 0);
                $attributes['actual_check_out'] = $checkOut->setTime(11, 0);
            }

            Booking::updateOrCreate(['booking_reference' => $reference], $attributes);
        }
    }

    /**
     * @param array<int, Room> $rooms
     */
    private function seedHousekeepingTasks(array $rooms): void
    {
        if ($rooms === []) return;

        $adminUser = User::query()->first();
        $tasks = [
            ['room_number' => '101', 'task_type' => 'cleaning', 'priority' => 'normal', 'status' => 'pending', 'notes' => 'Post-checkout clean'],
            ['room_number' => '103', 'task_type' => 'cleaning', 'priority' => 'urgent', 'status' => 'in_progress', 'notes' => 'Express clean for incoming guest'],
            ['room_number' => '201', 'task_type' => 'turndown', 'priority' => 'normal', 'status' => 'pending', 'notes' => ''],
            ['room_number' => '202', 'task_type' => 'inspection', 'priority' => 'low', 'status' => 'pending', 'notes' => 'Weekly inspection'],
            ['room_number' => '302', 'task_type' => 'cleaning', 'priority' => 'normal', 'status' => 'completed', 'notes' => 'Deep cleaned'],
        ];

        $roomByNumber = collect($rooms)->keyBy('room_number');
        foreach ($tasks as $row) {
            $room = $roomByNumber->get($row['room_number']);
            if (!$room) continue;
            $attrs = [
                'room_id' => $room->id,
                'task_type' => $row['task_type'],
                'priority' => $row['priority'],
                'status' => $row['status'],
                'notes' => $row['notes'] ?: null,
            ];
            if ($adminUser) {
                $attrs['assigned_to'] = $adminUser->id;
            }
            if ($row['status'] === 'completed') {
                $attrs['completed_at'] = now()->subHours(2);
            }
            HousekeepingTask::updateOrCreate(
                ['room_id' => $room->id, 'task_type' => $row['task_type'], 'status' => $row['status']],
                $attrs,
            );
        }
    }

    private function seedPayments(): void
    {
        // For each existing booking, attach 1-2 payment rows whose amounts
        // total the booking's total_price. Cancelled bookings get no payments.
        // Bookings without payments are still in the DB so the controllers
        // exercise the booking-fallback revenue path.
        $bookings = Booking::with('room')->get();

        $strategy = [
            'checked_out' => [['fraction' => 0.5, 'method' => 'mpesa', 'days_ago' => 8], ['fraction' => 0.5, 'method' => 'cash', 'days_ago' => 1]],
            'checked_in' => [['fraction' => 0.6, 'method' => 'card', 'days_ago' => 3], ['fraction' => 0.4, 'method' => 'mpesa', 'days_ago' => 1]],
            'confirmed' => [['fraction' => 0.3, 'method' => 'bank', 'days_ago' => 2]],
            'pending' => [],
            'cancelled' => [],
        ];

        foreach ($bookings as $booking) {
            $rows = $strategy[$booking->status] ?? [];
            foreach ($rows as $i => $row) {
                $amount = round(((float) $booking->total_price) * $row['fraction'], 2);
                if ($amount <= 0) continue;

                // Use booking_reference + index as a stable uniqueness key so
                // re-running the seeder doesn't double-insert payments.
                $transactionRef = $booking->booking_reference . '-P' . ($i + 1);
                Payment::updateOrCreate(
                    ['transaction_reference' => $transactionRef],
                    [
                        'booking_id' => $booking->id,
                        'amount' => $amount,
                        'method' => $row['method'],
                        'payment_method' => $row['method'],
                        'status' => 'completed',
                        'paid_at' => now()->subDays($row['days_ago']),
                    ],
                );
            }
        }
    }
}

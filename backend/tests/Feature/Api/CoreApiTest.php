<?php

namespace Tests\Feature\Api;

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CoreApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_room_types_and_rooms(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $roomTypeId = $this->postJson('/api/room-types', [
            'name' => 'Deluxe Suite',
            'base_price' => 120,
            'max_occupancy' => 3,
            'amenities' => ['wifi', 'breakfast'],
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->json('data.id');

        $roomId = $this->postJson('/api/rooms', [
            'room_type_id' => $roomTypeId,
            'room_number' => '101',
            'floor' => 1,
            'status' => 'available',
            'is_active' => true,
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->json('data.id');

        $this->getJson('/api/rooms/' . $roomId)
            ->assertOk()
            ->assertJsonPath('data.room_number', '101');

        $this->patchJson('/api/rooms/' . $roomId, [
            'status' => 'maintenance',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'maintenance');
    }

    public function test_guest_payment_and_booking_conflict_paths(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        [$roomType, $room, $guest] = $this->hotelRecords();

        $bookingId = $this->postJson('/api/bookings', [
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'room_type_id' => $roomType->id,
            'check_in_date' => '2026-06-01',
            'check_out_date' => '2026-06-03',
            'num_adults' => 2,
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->json('data.id');

        $this->postJson('/api/bookings', [
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'room_type_id' => $roomType->id,
            'check_in_date' => '2026-06-02',
            'check_out_date' => '2026-06-04',
            'num_adults' => 1,
        ])
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->postJson('/api/payments', [
            'booking_id' => $bookingId,
            'amount' => 150,
            'payment_method' => 'cash',
            'payment_date' => '2026-06-01',
            'reference_number' => 'RCPT-1',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true);
    }

    public function test_invalid_booking_dates_return_validation_error(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        [$roomType, $room, $guest] = $this->hotelRecords();

        $this->postJson('/api/bookings', [
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'room_type_id' => $roomType->id,
            'check_in_date' => '2026-06-03',
            'check_out_date' => '2026-06-01',
            'num_adults' => 1,
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed');
    }

    public function test_available_rooms_excludes_contained_overlap(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        [$roomType, $room, $guest] = $this->hotelRecords();

        Booking::create([
            'booking_reference' => 'BK-TEST',
            'guest_id' => $guest->id,
            'room_id' => $room->id,
            'room_type_id' => $roomType->id,
            'check_in_date' => '2026-06-01',
            'check_out_date' => '2026-06-10',
            'num_adults' => 1,
            'status' => 'confirmed',
            'source' => 'direct',
            'subtotal' => 100,
            'tax_amount' => 16,
            'discount_amount' => 0,
            'total_price' => 116,
        ]);

        $this->getJson('/api/available-rooms?check_in_date=2026-06-03&check_out_date=2026-06-05')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data');
    }

    private function hotelRecords(): array
    {
        $roomType = RoomType::create([
            'name' => 'Standard',
            'slug' => 'standard',
            'base_price' => 100,
            'max_occupancy' => 2,
        ]);

        $room = Room::create([
            'room_type_id' => $roomType->id,
            'room_number' => '201',
            'floor' => 2,
            'status' => 'available',
            'is_active' => true,
        ]);

        $guest = Guest::create([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
        ]);

        return [$roomType, $room, $guest];
    }
}

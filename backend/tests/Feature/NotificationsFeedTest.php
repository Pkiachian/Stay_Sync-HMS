<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Room;
use App\Models\RoomStatusLog;
use App\Models\RoomType;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * The header-bell notifications feed is derived from the source-of-truth
 * tables (bookings, payments, room_status_logs, service_requests). It does
 * not have its own persistence layer — read state is per-user and managed
 * client-side. The tests pin down the contract:
 *   1. Auth is required (a public endpoint would leak guest/booking details).
 *   2. The shape is stable (id, type, title, message, created_at, …).
 *   3. The merged feed is ordered newest-first.
 *   4. Empty DB returns an empty list, not an error.
 *   5. The limit param is respected and clamped.
 */
class NotificationsFeedTest extends TestCase
{
    use RefreshDatabase;

    private function makeStaff(string $role = 'receptionist'): User
    {
        return User::create([
            'name'     => $role,
            'email'    => $role . '-' . uniqid() . '@example.test',
            'password' => Hash::make('secret'),
            'role'     => $role,
        ]);
    }

    private function makeRoom(): Room
    {
        $type = RoomType::create([
            'name' => 'Std',
            'slug' => 's-' . uniqid(),
            'base_price' => 8000,
            'max_occupancy' => 2,
        ]);
        return Room::create([
            'room_number' => (string) (1000 + (int) substr(uniqid(), -6)),
            'room_type_id' => $type->id,
            'floor' => 1,
            'status' => 'available',
            'is_active' => true,
        ]);
    }

    private function makeGuest(string $first, string $last): Guest
    {
        return Guest::create([
            'first_name' => $first,
            'last_name'  => $last,
            'phone'      => '+254700000000',
        ]);
    }

    public function test_notifications_requires_authentication(): void
    {
        $this->getJson('/api/notifications')->assertStatus(401);
    }

    public function test_notifications_returns_empty_list_when_no_activity(): void
    {
        $user = $this->makeStaff();

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk()
            ->json();

        $this->assertSame([], $res['data']['notifications']);
        $this->assertSame(0, $res['data']['count']);
    }

    public function test_notifications_merges_bookings_payments_and_room_status(): void
    {
        $user    = $this->makeStaff();
        $room    = $this->makeRoom();
        $guest   = $this->makeGuest('Jane', 'Mwangi');
        $booking = Booking::create([
            'booking_reference' => 'BK-' . strtoupper(uniqid()),
            'guest_id'          => $guest->id,
            'room_id'           => $room->id,
            'room_type_id'      => $room->room_type_id,
            'check_in_date'     => '2026-07-01',
            'check_out_date'    => '2026-07-05',
            'num_adults'        => 1,
            'status'            => 'confirmed',
            'source'            => 'walk_in',
            'subtotal'          => 32000,
            'tax_amount'        => 5120,
            'total_price'       => 37120,
        ]);

        Payment::create([
            'booking_id'           => $booking->id,
            'amount'               => 10000,
            'payment_method'       => 'mpesa',
            'status'               => 'completed',
            'purpose'              => 'deposit',
            'transaction_reference'=> 'TX-' . uniqid(),
            'paid_at'              => now(),
        ]);

        RoomStatusLog::create([
            'room_id'    => $room->id,
            'old_status' => 'dirty',
            'new_status' => 'cleaning',
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk()
            ->json();

        $types = array_column($res['data']['notifications'], 'type');
        $this->assertContains('booking', $types);
        $this->assertContains('payment', $types);
        $this->assertContains('room_status', $types);

        // Stable id format
        $ids = array_column($res['data']['notifications'], 'id');
        foreach ($ids as $id) {
            $this->assertMatchesRegularExpression('/^(booking|payment|room_status|service_request)-\d+$/', $id);
        }

        // Newest-first ordering
        $timestamps = array_column($res['data']['notifications'], 'created_at');
        $sorted = $timestamps;
        rsort($sorted);
        $this->assertSame($sorted, $timestamps);
    }

    public function test_notifications_includes_service_requests(): void
    {
        $user = $this->makeStaff();

        ServiceRequest::create([
            'reference'   => 'SR-' . strtoupper(uniqid()),
            'service_type'=> 'taxi',
            'source'      => 'guest_portal',
            'guest_name'  => 'Alice',
            'room_number' => '202',
            'details'     => 'Need a taxi to JKIA at 6am',
            'status'      => 'open',
        ]);

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk()
            ->json();

        $types = array_column($res['data']['notifications'], 'type');
        $this->assertContains('service_request', $types);

        $sr = collect($res['data']['notifications'])
            ->firstWhere('type', 'service_request');
        $this->assertStringContainsString('Taxi request', $sr['title']);
        $this->assertSame('Alice', $sr['actor']);
    }

    public function test_notifications_respects_and_clamps_limit(): void
    {
        $user  = $this->makeStaff();
        $room  = $this->makeRoom();
        $guest = $this->makeGuest('Test', 'User');

        // Create 5 bookings — all on the same guest/room
        for ($i = 0; $i < 5; $i++) {
            Booking::create([
                'booking_reference' => 'BK-' . strtoupper(uniqid()) . $i,
                'guest_id'          => $guest->id,
                'room_id'           => $room->id,
                'room_type_id'      => $room->room_type_id,
                'check_in_date'     => '2026-08-0' . ($i + 1),
                'check_out_date'    => '2026-08-0' . ($i + 2),
                'num_adults'        => 1,
                'status'            => 'confirmed',
                'source'            => 'walk_in',
                'subtotal'          => 1000,
                'tax_amount'        => 160,
                'total_price'       => 1160,
            ]);
        }

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications?limit=2')
            ->assertOk()
            ->json();

        $this->assertSame(2, $res['data']['count']);
        $this->assertCount(2, $res['data']['notifications']);

        // limit=0 is clamped up to 1, not zero
        $res2 = $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications?limit=0')
            ->assertOk()
            ->json();
        $this->assertSame(1, $res2['data']['count']);

        // limit=1000 is clamped down to MAX_LIMIT (25)
        $res3 = $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications?limit=1000')
            ->assertOk()
            ->json();
        $this->assertLessThanOrEqual(25, $res3['data']['count']);
    }

    public function test_notifications_omits_pending_payments(): void
    {
        $user    = $this->makeStaff();
        $room    = $this->makeRoom();
        $guest   = $this->makeGuest('Pending', 'Pay');
        $booking = Booking::create([
            'booking_reference' => 'BK-' . strtoupper(uniqid()),
            'guest_id'          => $guest->id,
            'room_id'           => $room->id,
            'room_type_id'      => $room->room_type_id,
            'check_in_date'     => '2026-09-01',
            'check_out_date'    => '2026-09-03',
            'num_adults'        => 1,
            'status'            => 'confirmed',
            'source'            => 'walk_in',
            'subtotal'          => 1000,
            'tax_amount'        => 160,
            'total_price'       => 1160,
        ]);

        Payment::create([
            'booking_id'     => $booking->id,
            'amount'         => 5000,
            'payment_method' => 'cash',
            'status'         => 'pending',
            'purpose'        => 'deposit',
        ]);

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertOk()
            ->json();

        $types = array_column($res['data']['notifications'], 'type');
        $this->assertNotContains('payment', $types);
    }
}

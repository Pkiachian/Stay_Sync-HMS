<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * The receptionist-side payment endpoints. Two important gates to lock
 * down:
 *   1. M-Pesa verify must require staff auth — a public endpoint would
 *      leak completed payments (and the booking data attached to them).
 *   2. Verify must return only completed M-Pesa payments, never pending
 *      rows that have not yet been confirmed by the Safaricom callback.
 */
class PaymentVerifyTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role = 'receptionist'): User
    {
        return User::create([
            'name'     => $role,
            'email'    => $role . '-' . uniqid() . '@example.test',
            'password' => Hash::make('secret'),
            'role'     => $role,
        ]);
    }

    private function makeBookingWithMpesaPayment(string $ref, string $status = 'completed', float $amount = 5000): array
    {
        $type  = RoomType::create(['name' => 'Std', 'slug' => 's-' . uniqid(), 'base_price' => 10000, 'max_occupancy' => 2]);
        $room  = Room::create(['room_number' => '1' . random_int(0, 9), 'room_type_id' => $type->id, 'floor' => 1, 'status' => 'available', 'is_active' => true]);
        $guest = Guest::create(['first_name' => 'X', 'last_name' => 'Y', 'phone' => '+254700000000']);
        $book  = Booking::create([
            'booking_reference' => 'BK-' . strtoupper(uniqid()),
            'guest_id'          => $guest->id,
            'room_id'           => $room->id,
            'room_type_id'      => $type->id,
            'check_in_date'     => '2026-07-01',
            'check_out_date'    => '2026-07-05',
            'num_adults'        => 1,
            'status'            => 'confirmed',
            'source'            => 'online_portal',
            'subtotal'          => 40000,
            'tax_amount'        => 6400,
            'total_price'       => 46400,
        ]);
        $p = Payment::create([
            'booking_id'           => $book->id,
            'amount'               => $amount,
            'payment_method'       => 'mpesa',
            'status'               => $status,
            'purpose'              => 'deposit',
            'transaction_reference'=> $ref,
            'paid_at'              => now(),
        ]);
        return [$book, $p];
    }

    public function test_verify_mpesa_requires_authentication(): void
    {
        $this->getJson('/api/payments/verify?reference=ABC123')
            ->assertStatus(401);
    }

    public function test_verify_mpesa_returns_completed_payment(): void
    {
        $user = $this->makeUser('receptionist');
        [$booking, $payment] = $this->makeBookingWithMpesaPayment('TGJ7ABC123');

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/payments/verify?reference=TGJ7ABC123');

        $res->assertOk()
            ->assertJsonPath('data.payment.id', $payment->id)
            ->assertJsonPath('data.payment.booking_id', $booking->id);
    }

    public function test_verify_mpesa_skips_pending_payments(): void
    {
        $user = $this->makeUser('receptionist');
        // Pending row must not be confirmable by the receptionist — that
        // would let them mark a guest as paid before the callback fires.
        $this->makeBookingWithMpesaPayment('PENDING-XYZ', 'pending', 0);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/payments/verify?reference=PENDING-XYZ')
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_verify_mpesa_404s_on_unknown_reference(): void
    {
        $user = $this->makeUser('receptionist');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/payments/verify?reference=NO-SUCH-REF')
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_verify_mpesa_validates_reference_length(): void
    {
        $user = $this->makeUser('receptionist');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/payments/verify?reference=ab') // < 4 chars
            ->assertStatus(422)
            ->assertJsonValidationErrors(['reference']);
    }

    public function test_store_payment_creates_a_completed_record(): void
    {
        $user = $this->makeUser('receptionist');
        $type  = RoomType::create(['name' => 'Std', 'slug' => 's-' . uniqid(), 'base_price' => 10000, 'max_occupancy' => 2]);
        $room  = Room::create(['room_number' => '8' . random_int(0, 9), 'room_type_id' => $type->id, 'floor' => 1, 'status' => 'available', 'is_active' => true]);
        $guest = Guest::create(['first_name' => 'X', 'last_name' => 'Y', 'phone' => '+254711111111']);
        $book  = Booking::create([
            'booking_reference' => 'BK-' . strtoupper(uniqid()),
            'guest_id'          => $guest->id,
            'room_id'           => $room->id,
            'room_type_id'      => $type->id,
            'check_in_date'     => '2026-07-01',
            'check_out_date'    => '2026-07-05',
            'num_adults'        => 1,
            'status'            => 'confirmed',
            'source'            => 'direct',
            'total_price'       => 46400,
        ]);

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/payments', [
            'booking_id'      => $book->id,
            'amount'          => 2000,
            'payment_method'  => 'cash',
            'payment_date'    => '2026-06-15',
            'reference_number'=> 'CASH-99',
        ]);

        $res->assertCreated();
        $this->assertEquals(2000, (float) $res->json('data.amount'));
        $this->assertEquals('cash',   $res->json('data.payment_method'));
        $this->assertEquals('completed', $res->json('data.status'));
        $this->assertEquals('CASH-99', $res->json('data.transaction_reference'));
    }

    public function test_store_payment_rejects_invalid_method(): void
    {
        $user = $this->makeUser('receptionist');
        $type  = RoomType::create(['name' => 'Std', 'slug' => 's-' . uniqid(), 'base_price' => 10000, 'max_occupancy' => 2]);
        $room  = Room::create(['room_number' => '8' . random_int(0, 9), 'room_type_id' => $type->id, 'floor' => 1, 'status' => 'available', 'is_active' => true]);
        $guest = Guest::create(['first_name' => 'X', 'last_name' => 'Y', 'phone' => '+254711111111']);
        $book  = Booking::create([
            'booking_reference' => 'BK-' . strtoupper(uniqid()),
            'guest_id'          => $guest->id,
            'room_id'           => $room->id,
            'room_type_id'      => $type->id,
            'check_in_date'     => '2026-07-01',
            'check_out_date'    => '2026-07-05',
            'num_adults'        => 1,
            'status'            => 'confirmed',
            'source'            => 'direct',
            'total_price'       => 46400,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments', [
                'booking_id'     => $book->id,
                'amount'         => 2000,
                'payment_method' => 'crypto', // not in the allowed set
                'payment_date'   => '2026-06-15',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method']);
    }
}

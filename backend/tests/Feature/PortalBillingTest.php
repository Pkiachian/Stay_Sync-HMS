<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\FolioCharge;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Tests\TestCase;

/**
 * Covers the public guest portal: lookup, listInvoices scoping, the
 * synthetic balance-due line, the cancel rules, and the token purpose
 * separation. The aim is to lock the user-visible behavior of the
 * billing page so a future refactor cannot silently re-leak data
 * across bookings.
 */
class PortalBillingTest extends TestCase
{
    use RefreshDatabase;

    private function makeRoomType(): RoomType
    {
        return RoomType::create([
            'name'          => 'Standard',
            'slug'          => 'std-' . uniqid(),
            'base_price'    => 10000,
            'max_occupancy' => 2,
        ]);
    }

    private function makeRoom(RoomType $type): Room
    {
        return Room::create([
            'room_number' => '10' . random_int(0, 9),
            'room_type_id'=> $type->id,
            'floor'       => 1,
            'status'      => 'available',
            'is_active'   => true,
        ]);
    }

    private function makeGuest(string $first = 'Jane', string $last = 'Doe'): Guest
    {
        return Guest::create([
            'first_name' => $first,
            'last_name'  => $last,
            'phone'      => '+2547' . random_int(10000000, 99999999),
            'email'      => strtolower($first) . '.' . strtolower($last) . '@example.test',
        ]);
    }

    private function makeBooking(Guest $guest, Room $room, RoomType $type, array $overrides = []): Booking
    {
        return Booking::create(array_merge([
            'booking_reference' => 'BK-' . strtoupper(uniqid()),
            'guest_id'          => $guest->id,
            'room_id'           => $room->id,
            'room_type_id'      => $type->id,
            'check_in_date'     => '2026-07-01',
            'check_out_date'    => '2026-07-05',
            'num_adults'        => 1,
            'num_children'      => 0,
            'status'            => 'confirmed',
            'source'            => 'online_portal',
            'subtotal'          => 40000,
            'tax_amount'        => 6400,
            'total_price'       => 46400,
        ], $overrides));
    }

    private function listToken(Booking $b, string $last = 'Doe', string $purpose = 'list', int $ttl = 600): string
    {
        return Crypt::encryptString(json_encode([
            'bid'        => $b->id,
            'ln'         => strtolower($last),
            'purpose'    => $purpose,
            'expires_at' => time() + $ttl,
        ]));
    }

    public function test_lookup_returns_booking_and_access_token(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest('Alice', 'Smith');
        $book  = $this->makeBooking($guest, $room, $type);

        $res = $this->getJson("/api/portal/bookings/lookup?reference={$book->booking_reference}&last_name=Smith");
        $res->assertOk()
            ->assertJsonPath('data.booking.id', $book->id)
            ->assertJsonPath('data.booking.booking_reference', $book->booking_reference)
            ->assertJsonStructure(['data' => ['access_token', 'expires_in', 'booking']]);
    }

    public function test_lookup_404s_when_last_name_mismatches(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest('Alice', 'Smith');
        $book  = $this->makeBooking($guest, $room, $type);

        $this->getJson("/api/portal/bookings/lookup?reference={$book->booking_reference}&last_name=Doe")
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_lookup_rate_limits_repeated_lookups(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest('Alice', 'Smith');
        $book  = $this->makeBooking($guest, $room, $type);

        // 11 requests with the same reference — the portal-lookup limiter
        // caps at 10 per 5 min, so the last one must be throttled.
        $tooMany = false;
        for ($i = 0; $i < 11; $i++) {
            $r = $this->getJson("/api/portal/bookings/lookup?reference={$book->booking_reference}&last_name=Smith");
            if ($r->status() === 429) {
                $tooMany = true;
                break;
            }
        }
        $this->assertTrue($tooMany, 'expected the 11th lookup to be throttled');
    }

    public function test_invoices_require_valid_token(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type);

        $this->getJson("/api/portal/bookings/{$book->id}/invoices?token=bogus")
            ->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_invoices_do_not_leak_other_bookings(): void
    {
        $type  = $this->makeRoomType();
        $aRoom = $this->makeRoom($type);
        $bRoom = $this->makeRoom($type);
        $aGuest = $this->makeGuest('A', 'Aardvark');
        $bGuest = $this->makeGuest('B', 'Beaver');
        $a = $this->makeBooking($aGuest, $aRoom, $type, ['total_price' => 10000]);
        $b = $this->makeBooking($bGuest, $bRoom, $type, ['total_price' => 50000]);

        // 1,000 KES paid on A; 50,000 paid on B.
        Payment::create([
            'booking_id'           => $a->id,
            'amount'               => 1000,
            'payment_method'       => 'mpesa',
            'status'               => 'completed',
            'purpose'              => 'deposit',
            'transaction_reference'=> 'REF-A-1',
            'paid_at'              => now(),
        ]);
        Payment::create([
            'booking_id'           => $b->id,
            'amount'               => 50000,
            'payment_method'       => 'cash',
            'status'               => 'completed',
            'transaction_reference'=> 'REF-B-1',
            'paid_at'              => now(),
        ]);

        $tokenA = $this->listToken($a, 'Aardvark');

        $res = $this->getJson("/api/portal/bookings/{$a->id}/invoices?token={$tokenA}");
        $res->assertOk();

        $ids = collect($res->json('data.lines'))->pluck('id')->all();
        $this->assertContains('PAY-1', $ids, 'A should see its own payment');
        $this->assertNotContains('PAY-2', $ids, 'A must NOT see Bs payment');

        // And B can't be reached with A's token.
        $this->getJson("/api/portal/bookings/{$b->id}/invoices?token={$tokenA}")
            ->assertStatus(401);
    }

    public function test_invoices_appends_synthetic_balance_line_when_outstanding_due(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type, ['total_price' => 99000]);

        Payment::create([
            'booking_id'           => $book->id,
            'amount'               => 49500,
            'payment_method'       => 'cash',
            'status'               => 'completed',
            'transaction_reference'=> 'CASH-1',
            'paid_at'              => '2026-06-04',
        ]);
        Payment::create([
            'booking_id'           => $book->id,
            'amount'               => 5000,
            'payment_method'       => 'mpesa',
            'status'               => 'completed',
            'purpose'              => 'deposit',
            'transaction_reference'=> 'MPESA-1',
            'paid_at'              => '2026-06-15',
        ]);

        $token = $this->listToken($book);
        $res = $this->getJson("/api/portal/bookings/{$book->id}/invoices?token={$token}");

        $res->assertOk();
        $lines = $res->json('data.lines');
        $balance = collect($lines)->firstWhere('id', "BAL-{$book->id}");
        $this->assertNotNull($balance, 'synthetic balance line must be present');
        $this->assertSame('pending', $balance['status']);
        $this->assertEquals(44500, (float) $balance['amount']);
    }

    public function test_invoices_skip_synthetic_balance_for_cancelled_booking(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type, [
            'total_price' => 20000,
            'status'      => 'cancelled',
        ]);

        // No payments, no folio. The synthetic balance should NOT
        // appear because there is nothing to pay on a cancelled stay.
        $token = $this->listToken($book);
        $res = $this->getJson("/api/portal/bookings/{$book->id}/invoices?token={$token}");

        $ids = collect($res->json('data.lines'))->pluck('id')->all();
        $this->assertNotContains("BAL-{$book->id}", $ids);
    }

    public function test_invoices_skip_synthetic_balance_when_fully_paid(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type, ['total_price' => 10000]);

        Payment::create([
            'booking_id'           => $book->id,
            'amount'               => 10000,
            'payment_method'       => 'cash',
            'status'               => 'completed',
            'transaction_reference'=> 'FULL-1',
            'paid_at'              => now(),
        ]);

        $token = $this->listToken($book);
        $res = $this->getJson("/api/portal/bookings/{$book->id}/invoices?token={$token}");

        $ids = collect($res->json('data.lines'))->pluck('id')->all();
        $this->assertNotContains("BAL-{$book->id}", $ids);
    }

    public function test_invoices_includes_pending_folio_charges(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type, ['total_price' => 50000]);

        FolioCharge::create([
            'booking_id' => $book->id,
            'charge_type'=> 'minibar',
            'description'=> 'Mini-bar (Coca-Cola x 2)',
            'amount'     => 500,
            'charged_at' => Carbon::parse('2026-06-10 12:00:00'),
        ]);

        $token = $this->listToken($book);
        $res = $this->getJson("/api/portal/bookings/{$book->id}/invoices?token={$token}");

        $lines = $res->json('data.lines');
        $folio = collect($lines)->firstWhere('id', 'FOLIO-1');
        $this->assertNotNull($folio, 'folio charge should appear in the listing');
        $this->assertSame('pending', $folio['status']);
        $this->assertEquals(500, (float) $folio['amount']);
    }

    public function test_pdf_token_purpose_cannot_be_used_for_listing(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type);

        $pdfToken = $this->listToken($book, 'Doe', 'pdf');

        // PDF-purpose token must be rejected by the listing endpoint
        // (which expects purpose=list).
        $this->getJson("/api/portal/bookings/{$book->id}/invoices?token={$pdfToken}")
            ->assertStatus(401);
    }

    public function test_list_token_purpose_cannot_be_used_for_pdf(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type);

        $listToken = $this->listToken($book, 'Doe', 'list');

        $this->get("/api/portal/bookings/{$book->id}/invoice?token={$listToken}")
            ->assertStatus(401);
    }

    public function test_expired_token_is_rejected(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type);

        $expired = $this->listToken($book, 'Doe', 'list', -1);

        $this->getJson("/api/portal/bookings/{$book->id}/invoices?token={$expired}")
            ->assertStatus(401);
    }

    public function test_cancel_requires_correct_last_name(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest('Sam', 'Mwangi');
        $book  = $this->makeBooking($guest, $room, $type);

        $this->postJson("/api/portal/bookings/{$book->id}/cancel", ['last_name' => 'Wrong'])
            ->assertStatus(403);

        $this->postJson("/api/portal/bookings/{$book->id}/cancel", ['last_name' => 'Mwangi'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_cancel_rejects_already_cancelled(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type, ['status' => 'cancelled']);

        $this->postJson("/api/portal/bookings/{$book->id}/cancel", ['last_name' => 'Doe'])
            ->assertStatus(409);
    }

    public function test_cancel_rejects_checked_in(): void
    {
        $type  = $this->makeRoomType();
        $room  = $this->makeRoom($type);
        $guest = $this->makeGuest();
        $book  = $this->makeBooking($guest, $room, $type, ['status' => 'checked_in']);

        $this->postJson("/api/portal/bookings/{$book->id}/cancel", ['last_name' => 'Doe'])
            ->assertStatus(409);
    }
}

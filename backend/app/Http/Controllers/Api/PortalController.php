<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Room;
use App\Models\RoomServiceMenuItem;
use App\Models\RoomServiceOrder;
use App\Models\RoomServiceOrderItem;
use App\Models\RoomType;
use App\Services\BookingService;
use App\Services\MpesaService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PortalController extends Controller
{
    public function __construct(
        private BookingService $bookingService,
        private MpesaService $mpesa,
    ) {}

    public function getRoomTypes()
    {
        return $this->success('Room types retrieved successfully', RoomType::orderBy('base_price')->get());
    }

    public function getAvailableRooms(Request $request)
    {
        $data = $request->validate([
            'check_in_date'  => 'required|date',
            'check_out_date' => 'required|date|after:check_in_date',
            'room_type_id'   => 'nullable|exists:room_types,id',
        ]);

        $bookedRoomIds = Booking::where('status', '!=', 'cancelled')
            ->where('check_in_date', '<', $data['check_out_date'])
            ->where('check_out_date', '>', $data['check_in_date'])
            ->pluck('room_id');

        $query = Room::with('roomType')
            ->whereNotIn('id', $bookedRoomIds)
            ->where('status', 'available')
            ->where('is_active', true);

        if (!empty($data['room_type_id'])) {
            $query->where('room_type_id', $data['room_type_id']);
        }

        return $this->success('Available rooms retrieved successfully', $query->orderBy('room_number')->get());
    }

    public function createBooking(Request $request)
    {
        $data = $request->validate([
            'first_name'       => 'required|string|max:255',
            'last_name'        => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',
            'phone'            => 'required|string|max:32',
            'room_id'          => 'required|exists:rooms,id',
            'room_type_id'     => 'required|exists:room_types,id',
            'check_in_date'    => 'required|date|after_or_equal:today',
            'check_out_date'   => 'required|date|after:check_in_date',
            'num_adults'       => 'required|integer|min:1',
            'num_children'     => 'nullable|integer|min:0',
            'special_requests' => 'nullable|string|max:1000',
        ]);

        $guest = Guest::where('phone', $data['phone'])->first();
        if (!$guest) {
            $guest = Guest::create([
                'first_name' => $data['first_name'],
                'last_name'  => $data['last_name'],
                'email'      => $data['email'] ?? null,
                'phone'      => $data['phone'],
            ]);
        }

        $booking = $this->bookingService->createBooking([
            'guest_id'         => $guest->id,
            'room_id'          => $data['room_id'],
            'room_type_id'     => $data['room_type_id'],
            'check_in_date'    => $data['check_in_date'],
            'check_out_date'   => $data['check_out_date'],
            'num_adults'       => $data['num_adults'],
            'num_children'     => $data['num_children'] ?? 0,
            'source'           => 'online_portal',
            'special_requests' => $data['special_requests'] ?? null,
        ]);

        return $this->success('Booking created successfully', $booking->load(['guest', 'room', 'roomType']), 201);
    }

    public function lookupBooking(Request $request)
    {
        $data = $request->validate([
            'reference' => 'required|string',
            'last_name' => 'required|string',
        ]);

        $booking = Booking::with(['guest', 'room', 'roomType'])
            ->where('booking_reference', $data['reference'])
            ->whereHas('guest', fn ($q) => $q->where('last_name', $data['last_name']))
            ->first();

        if (!$booking) {
            return $this->error('No booking found for that reference and last name', null, 404);
        }

        $accessToken = $this->issuePortalToken($booking->id, $data['last_name'], 600);

        return $this->success('Booking found', [
            'booking'      => $booking,
            'access_token' => $accessToken,
            'expires_in'   => 600,
        ]);
    }

    /**
     * List the folio charges and payments for a single booking. Requires a
     * valid portal access token issued by lookupBooking (or any other route
     * that proves the guest controls the booking). The booking id is
     * derived from the token, not the URL — clients cannot pivot to other
     * bookings by editing the path.
     */
    public function listInvoices(Request $request, $id)
    {
        $token = (string) $request->query('token', '');
        $info  = $this->verifyPortalToken($token);
        if (!$info || $info['booking_id'] !== (int) $id) {
            return $this->error('Invalid or expired access token', null, 401);
        }

        $booking = Booking::with(['folioCharges', 'payments'])
            ->findOrFail($id);

        $charges = $booking->folioCharges->map(function ($c) {
            $chargedAt = $c->charged_at ? \Illuminate\Support\Carbon::parse($c->charged_at) : null;
            $createdAt = $c->created_at ? \Illuminate\Support\Carbon::parse($c->created_at) : null;
            return [
                'id'          => 'FOLIO-' . $c->id,
                'date'        => ($chargedAt ?? $createdAt)?->toDateString(),
                'description' => $c->description,
                'amount'      => (float) $c->amount,
                'status'      => 'pending',
            ];
        })->values();

        $payments = $booking->payments
            ->where('status', 'completed')
            ->map(function ($p) {
                $paidAt = $p->paid_at ? \Illuminate\Support\Carbon::parse($p->paid_at) : null;
                $createdAt = $p->created_at ? \Illuminate\Support\Carbon::parse($p->created_at) : null;
                return [
                    'id'          => 'PAY-' . $p->id,
                    'date'        => ($paidAt ?? $createdAt)?->toDateString(),
                    'description' => ($p->purpose === 'deposit' ? 'Deposit' : ucfirst($p->payment_method)) . ' payment' . ($p->transaction_reference ? ' · ' . $p->transaction_reference : ''),
                    'amount'      => (float) $p->amount,
                    'status'      => 'paid',
                    'purpose'     => $p->purpose,
                ];
            })->values();

        $lines = collect($charges->all())->merge($payments->all())->sortByDesc('date')->values();

        $totalPrice    = (float) $booking->total_price;
        $chargedTotal  = (float) $booking->folioCharges->sum('amount');
        $paidTotal     = (float) $booking->payments->where('status', 'completed')->sum('amount');
        $outstanding   = max(0, max($totalPrice, $chargedTotal) - $paidTotal);

        if ($outstanding > 0.01 && $booking->status !== 'cancelled') {
            $lines->push([
                'id'          => 'BAL-' . $booking->id,
                'date'        => $booking->check_out_date?->toDateString(),
                'description' => 'Balance due on arrival',
                'amount'      => $outstanding,
                'status'      => 'pending',
            ]);
            $lines = $lines->sortByDesc('date')->values();
        }

        Log::info('portal_invoice_viewed', [
            'booking_id' => $booking->id,
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
            'count'      => $lines->count(),
        ]);

        $pdfToken = $this->issuePortalToken($booking->id, $info['last_name'], 900, 'pdf');

        return $this->success('Invoices retrieved', [
            'booking' => [
                'id'                => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'check_in_date'     => $booking->check_in_date?->toDateString(),
                'check_out_date'    => $booking->check_out_date?->toDateString(),
                'status'            => $booking->status,
                'total_price'       => (float) $booking->total_price,
            ],
            'lines'         => $lines,
            'pdf_token'     => $pdfToken,
            'pdf_expires_in'=> 900,
        ]);
    }

    public function cancelBooking(Request $request, $id)
    {
        $data = $request->validate([
            'last_name' => 'required|string',
        ]);

        $booking = Booking::with('guest')->findOrFail($id);

        if (strcasecmp($booking->guest->last_name, $data['last_name']) !== 0) {
            return $this->error('Last name does not match the guest on this booking', null, 403);
        }

        if ($booking->status === 'cancelled') {
            return $this->error('This booking is already cancelled', null, 409);
        }

        if (in_array($booking->status, ['checked_in', 'checked_out'], true)) {
            return $this->error('This booking can no longer be cancelled online. Please contact the front desk.', null, 409);
        }

        $booking->update(['status' => 'cancelled']);

        return $this->success('Booking cancelled', $booking->fresh()->load(['guest', 'room', 'roomType']));
    }

    public function stkPush(Request $request)
    {
        $data = $request->validate([
            'phone'     => 'required|string|min:9|max:20',
            'amount'    => 'required|integer|min:1|max:1000000',
            'reference' => 'required|string|max:12',
            'purpose'   => 'nullable|in:deposit,full,partial',
        ]);

        $purpose = $data['purpose'] ?? 'deposit';

        $result = $this->mpesa->stkPush($data['phone'], (int) $data['amount'], $data['reference'], $purpose);

        if (empty($result) || isset($result['errorCode'])) {
            $message = $result['errorMessage'] ?? 'M-Pesa request failed. Please try again.';
            return $this->error($message, $result, 502);
        }

        return $this->success('STK push sent. Check your phone to complete payment.', [
            'stk'     => $result,
            'purpose' => $purpose,
        ]);
    }

    public function invoice(Request $request, $id)
    {
        $type = $request->query('type', 'invoice');
        if (!in_array($type, ['invoice', 'receipt'], true)) {
            $type = 'invoice';
        }

        $token = (string) $request->query('token', '');
        $info  = $this->verifyPortalToken($token, 'pdf');
        if (!$info || $info['booking_id'] !== (int) $id) {
            return $this->error('Invalid or expired access token', null, 401);
        }

        $booking = Booking::with(['guest', 'room', 'roomType', 'payments'])->findOrFail($id);

        Log::info('portal_invoice_pdf_viewed', [
            'booking_id' => $booking->id,
            'type'       => $type,
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $pdf = Pdf::loadView('invoice', compact('booking', 'type'));

        $filename = ($type === 'receipt' ? 'receipt-' : 'invoice-') . $booking->booking_reference . '.pdf';

        return $pdf->stream($filename);
    }

    /*
    |--------------------------------------------------------------------------
    | Room Service (public)
    |--------------------------------------------------------------------------
    |
    | Guests browse the menu, place orders, and check status using their
    | booking reference + last name. Staff manage fulfilment via the
    | authenticated controller.
    */

    public function roomServiceMenu()
    {
        $items = RoomServiceMenuItem::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return $this->success('Menu retrieved successfully', $items);
    }

    public function createRoomServiceOrder(Request $request)
    {
        $data = $request->validate([
            'reference'   => 'required|string',
            'last_name'   => 'required|string',
            'guest_name'  => 'required|string|max:120',
            'room_number' => 'nullable|string|max:20',
            'phone'       => 'nullable|string|max:32',
            'notes'       => 'nullable|string|max:500',
            'items'       => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer|exists:room_service_menu_items,id',
            'items.*.quantity'     => 'required|integer|min:1|max:50',
        ]);

        $booking = Booking::with('guest')
            ->where('booking_reference', $data['reference'])
            ->whereHas('guest', fn ($q) => $q->where('last_name', $data['last_name']))
            ->first();

        if (!$booking) {
            return $this->error('No booking found for that reference and last name', null, 404);
        }

        if (in_array($booking->status, ['cancelled'], true)) {
            return $this->error('This booking is no longer active', null, 409);
        }

        $menuIds = collect($data['items'])->pluck('menu_item_id')->all();
        $menu = RoomServiceMenuItem::whereIn('id', $menuIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        if ($menu->count() !== count(array_unique($menuIds))) {
            return $this->error('One or more menu items are unavailable', null, 422);
        }

        $order = DB::transaction(function () use ($data, $menu, $booking) {
            $reference = 'RS-' . strtoupper(Str::random(8));
            $total = 0;
            foreach ($data['items'] as $line) {
                $total += (float) $menu[$line['menu_item_id']]->price * (int) $line['quantity'];
            }

            $order = RoomServiceOrder::create([
                'reference'   => $reference,
                'booking_id'  => $booking->id,
                'guest_name'  => $data['guest_name'],
                'room_number' => $data['room_number'] ?? $booking->room?->room_number,
                'phone'       => $data['phone'] ?? $booking->guest->phone,
                'status'      => 'received',
                'total'       => $total,
                'notes'       => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $line) {
                $menuItem = $menu[$line['menu_item_id']];
                $qty = (int) $line['quantity'];
                RoomServiceOrderItem::create([
                    'order_id'    => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'item_name'   => $menuItem->name,
                    'unit_price'  => $menuItem->price,
                    'quantity'    => $qty,
                    'line_total'  => (float) $menuItem->price * $qty,
                ]);
            }

            return $order;
        });

        return $this->success('Order placed successfully', $order->load('items'), 201);
    }

    public function lookupRoomServiceOrder(Request $request)
    {
        $data = $request->validate([
            'reference' => 'required|string',
            'last_name' => 'required|string',
        ]);

        $order = RoomServiceOrder::with('items')
            ->where('reference', $data['reference'])
            ->whereHas('booking.guest', fn ($q) => $q->where('last_name', $data['last_name']))
            ->first();

        if (!$order) {
            return $this->error('No order found for that reference and last name', null, 404);
        }

        return $this->success('Order found', $order);
    }

    /**
     * Issue a short-lived, booking-bound, signed token. The payload is
     * encrypted with the app key, so a leaked token without the app key
     * can't be forged or inspected, and the embedded expiry is enforced
     * on every verify.
     */
    private function issuePortalToken(int $bookingId, string $lastName, int $ttlSeconds = 600, string $purpose = 'list'): string
    {
        $payload = [
            'bid'       => $bookingId,
            'ln'        => strtolower(trim($lastName)),
            'purpose'   => $purpose,
            'expires_at' => time() + $ttlSeconds,
        ];
        return Crypt::encryptString(json_encode($payload));
    }

    private function verifyPortalToken(string $token, string $expectedPurpose = 'list'): ?array
    {
        if ($token === '') return null;
        try {
            $raw = Crypt::decryptString($token);
        } catch (\Throwable) {
            return null;
        }
        $data = json_decode($raw, true);
        if (!is_array($data) || empty($data['expires_at']) || empty($data['bid'])) {
            return null;
        }
        if ($data['expires_at'] < time()) return null;
        if (($data['purpose'] ?? 'list') !== $expectedPurpose) return null;
        return [
            'booking_id' => (int) $data['bid'],
            'last_name'  => (string) ($data['ln'] ?? ''),
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\RoomStatusLog;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Aggregates recent front-desk activity into a single feed for the header
 * bell. We do NOT store notifications in their own table — that would mean
 * every event source (bookings, payments, room-status changes, service
 * requests) needs to write a row, plus per-user read state. The header bell
 * just needs "what's been happening"; the source-of-truth tables already
 * have timestamps. We project those into a unified shape and order by time.
 *
 * The shape is intentionally small and stable:
 *   id          string  stable id within the type, e.g. "booking-42"
 *   type        enum    booking | payment | room_status | service_request
 *   title       string  one line
 *   message     string  one line, slightly longer
 *   actor       ?string name of who did it
 *   created_at  ISO8601
 *   href        ?string client-side deep link (optional)
 *
 * Read state is per-user and is managed client-side (in localStorage)
 * keyed by the notification id, since the events are derived and not
 * persisted. That keeps the endpoint read-only and stable.
 */
class NotificationController extends Controller
{
    private const DEFAULT_LIMIT = 8;
    private const MAX_LIMIT = 25;

    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', self::DEFAULT_LIMIT);
        $limit = max(1, min(self::MAX_LIMIT, $limit));

        // We fetch slightly more per source than the limit so the merged feed
        // is representative even when one source dominates (e.g. lots of
        // room_status rows on a busy morning).
        $perSource = $limit + 2;

        $feed = collect()
            ->merge($this->recentBookings($perSource))
            ->merge($this->recentPayments($perSource))
            ->merge($this->recentRoomStatusChanges($perSource))
            ->merge($this->recentServiceRequests($perSource))
            ->sortByDesc(fn ($n) => $n['created_at'])
            ->take($limit)
            ->values()
            ->all();

        return $this->success('Notifications retrieved successfully', [
            'notifications' => $feed,
            'count'         => count($feed),
        ]);
    }

    private function recentBookings(int $limit): Collection
    {
        return Booking::with(['guest', 'room'])
            ->latest('created_at')
            ->limit($limit)
            ->get()
            ->map(function (Booking $b) {
                $guestName = trim(($b->guest?->first_name ?? '') . ' ' . ($b->guest?->last_name ?? '')) ?: 'Guest';
                $room = $b->room?->room_number;

                $title = match ($b->status) {
                    'checked_in'  => 'Guest checked in',
                    'checked_out' => 'Guest checked out',
                    'cancelled'   => 'Booking cancelled',
                    'confirmed'   => 'Booking confirmed',
                    default       => 'New booking',
                };

                $message = $room
                    ? sprintf('%s · Room %s · %s', $guestName, $room, $b->booking_reference)
                    : sprintf('%s · %s', $guestName, $b->booking_reference);

                return [
                    'id'         => 'booking-' . $b->id,
                    'type'       => 'booking',
                    'title'      => $title,
                    'message'    => $message,
                    'actor'      => null,
                    'created_at' => optional($b->created_at)->toIso8601String(),
                    'href'       => '/bookings?q=' . urlencode($b->booking_reference),
                ];
            });
    }

    private function recentPayments(int $limit): Collection
    {
        return Payment::with(['booking.guest', 'booking.room'])
            ->where('status', 'completed')
            ->latest('paid_at')
            ->limit($limit)
            ->get()
            ->map(function (Payment $p) {
                $booking = $p->booking;
                $guestName = trim(($booking?->guest?->first_name ?? '') . ' ' . ($booking?->guest?->last_name ?? '')) ?: 'Guest';
                $ref = $p->transaction_reference ?: ($booking?->booking_reference ?? '');
                $amount = number_format((float) $p->amount, 0);

                $methodLabel = match ($p->payment_method) {
                    'mpesa' => 'M-Pesa',
                    'card'  => 'Card',
                    'cash'  => 'Cash',
                    'bank'  => 'Bank',
                    default => ucfirst((string) $p->payment_method),
                };

                return [
                    'id'         => 'payment-' . $p->id,
                    'type'       => 'payment',
                    'title'      => "Payment received — KES {$amount}",
                    'message'    => sprintf('%s · %s%s', $guestName, $methodLabel, $ref ? ' · ' . $ref : ''),
                    'actor'      => null,
                    'created_at' => optional($p->paid_at ?? $p->updated_at)->toIso8601String(),
                    'href'       => $booking ? '/bookings?q=' . urlencode($booking->booking_reference) : null,
                ];
            });
    }

    private function recentRoomStatusChanges(int $limit): Collection
    {
        return RoomStatusLog::with(['room', 'changedBy'])
            ->latest('changed_at')
            ->limit($limit)
            ->get()
            ->map(function (RoomStatusLog $log) {
                $room = $log->room?->room_number ?? '?';
                $from = $log->old_status ?? 'unknown';
                $to   = $log->new_status ?? 'unknown';

                $title = match ($to) {
                    'dirty'         => 'Room marked dirty',
                    'cleaning'      => 'Cleaning started',
                    'clean'         => 'Room cleaned',
                    'inspected'     => 'Room inspected',
                    'available'     => 'Room ready for sale',
                    'maintenance'   => 'Room flagged for maintenance',
                    'out_of_service'=> 'Room taken out of service',
                    'occupied'      => 'Room occupied',
                    'reserved'      => 'Room reserved',
                    default         => 'Room status changed',
                };

                $actor = $log->changedBy?->name;
                $message = sprintf('%s → %s%s', ucfirst($from), $to, $actor ? ' by ' . $actor : '');

                return [
                    'id'         => 'room_status-' . $log->id,
                    'type'       => 'room_status',
                    'title'      => "{$title} — Room {$room}",
                    'message'    => $message,
                    'actor'      => $actor,
                    'created_at' => optional($log->changed_at)->toIso8601String(),
                    'href'       => '/housekeeping',
                ];
            });
    }

    private function recentServiceRequests(int $limit): Collection
    {
        return ServiceRequest::latest('created_at')
            ->limit($limit)
            ->get()
            ->map(function (ServiceRequest $r) {
                $title = match ($r->service_type) {
                    'housekeeping' => 'Housekeeping request',
                    'laundry'      => 'Laundry request',
                    'tour'         => 'Tour request',
                    'taxi'         => 'Taxi request',
                    'airport'      => 'Airport transfer request',
                    'wakeup'       => 'Wake-up call request',
                    'chat_handoff' => 'Guest asked for staff help',
                    default        => 'Guest service request',
                };

                $details = (string) ($r->details ?? '');
                $message = self::truncate($details, 100) ?: sprintf('From %s', $r->guest_name ?: 'a guest');

                return [
                    'id'         => 'service_request-' . $r->id,
                    'type'       => 'service_request',
                    'title'      => $title,
                    'message'    => $message,
                    'actor'      => $r->guest_name ?: null,
                    'created_at' => optional($r->created_at)->toIso8601String(),
                    'href'       => '/concierge-inbox',
                ];
            });
    }

    private static function truncate(string $value, int $limit): string
    {
        if (mb_strlen($value) <= $limit) {
            return $value;
        }
        return mb_substr($value, 0, $limit - 1) . '…';
    }
}

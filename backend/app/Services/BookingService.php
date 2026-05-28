<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\RateOverride;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BookingService
{
    public function createBooking(array $data)
    {
        return DB::transaction(function () use ($data) {

            $room = Room::lockForUpdate()->findOrFail($data['room_id']);

            if (!$room->is_active || $room->status !== 'available') {
                abort(409, 'Room is not available');
            }

            if ((int) $room->room_type_id !== (int) $data['room_type_id']) {
                abort(422, 'The selected room type does not match the selected room');
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent booking conflicts
            |--------------------------------------------------------------------------
            */

            $overlap = Booking::where('room_id', $room->id)
                ->where('status', '!=', 'cancelled')
                ->where(function ($q) use ($data) {
                    $q->where('check_in_date', '<', $data['check_out_date'])
                      ->where('check_out_date', '>', $data['check_in_date']);
                })
                ->exists();

            if ($overlap) {
                abort(409, 'Room already booked');
            }

            /*
            |--------------------------------------------------------------------------
            | Automatic Pricing Logic
            |--------------------------------------------------------------------------
            */

            $pricing = $this->calculatePrice(
                $data['room_type_id'],
                $data['check_in_date'],
                $data['check_out_date']
            );

            /*
            |--------------------------------------------------------------------------
            | Create booking
            |--------------------------------------------------------------------------
            */

            return Booking::create([

                'booking_reference' => 'BK-' . strtoupper(uniqid()),

                'guest_id' => $data['guest_id'],
                'room_id' => $data['room_id'],
                'room_type_id' => $data['room_type_id'],

                'check_in_date' => $data['check_in_date'],
                'check_out_date' => $data['check_out_date'],

                'num_adults' => $data['num_adults'] ?? 1,
                'num_children' => $data['num_children'] ?? 0,

                'status' => 'pending',

                'source' => $data['source'] ?? 'direct',

                'subtotal' => $pricing['subtotal'],
                'tax_amount' => $pricing['tax_amount'],
                'discount_amount' => 0,
                'total_price' => $pricing['total_price'],

                'special_requests' => $data['special_requests'] ?? null,
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing Engine
    |--------------------------------------------------------------------------
    */

    public function calculatePrice($roomTypeId, $checkIn, $checkOut)
    {
        $roomType = RoomType::findOrFail($roomTypeId);

        $basePrice = $roomType->base_price;

        $start = Carbon::parse($checkIn);
        $end = Carbon::parse($checkOut);

        $subtotal = 0;

        for ($date = $start->copy(); $date->lt($end); $date->addDay()) {

            /*
            |--------------------------------------------------------------------------
            | Check rate override
            |--------------------------------------------------------------------------
            */

            $override = RateOverride::where('room_type_id', $roomTypeId)
                ->whereDate('start_date', '<=', $date)
                ->whereDate('end_date', '>=', $date)
                ->first();

            /*
            |--------------------------------------------------------------------------
            | Weekend pricing example
            |--------------------------------------------------------------------------
            */

            $dailyRate = $override
                ? $override->price
                : $basePrice;

            // Weekend surcharge example
            if ($date->isWeekend()) {
                $dailyRate += 20;
            }

            $subtotal += $dailyRate;
        }

        $taxAmount = $subtotal * 0.16;

        $totalPrice = $subtotal + $taxAmount;

        return [
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_price' => round($totalPrice, 2),
        ];
    }
}

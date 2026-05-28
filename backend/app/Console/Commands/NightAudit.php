<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use App\Models\Room;
use Carbon\Carbon;

class NightAudit extends Command
{
    /**
     * Command name
     */
    protected $signature = 'night:audit';

    /**
     * Command description
     */
    protected $description = 'Run nightly hotel audit process';

    /**
     * Execute the command
     */
    public function handle()
    {
        $this->info('Starting Night Audit...');

        /*
        |--------------------------------------------------------------------------
        | AUTO CHECK-OUT EXPIRED BOOKINGS
        |--------------------------------------------------------------------------
        */

        $expiredBookings = Booking::whereDate(
                'check_out_date',
                '<',
                today()
            )
            ->where('status', 'checked_in')
            ->get();

        foreach ($expiredBookings as $booking) {

            $booking->update([
                'status' => 'checked_out',
                'actual_check_out' => now()
            ]);

            if ($booking->room) {
                $booking->room->update([
                    'status' => 'dirty'
                ]);
            }

            $this->info(
                'Checked out booking: ' .
                $booking->booking_reference
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MARK TODAY ARRIVALS AS CONFIRMED
        |--------------------------------------------------------------------------
        */

        $todayArrivals = Booking::whereDate(
                'check_in_date',
                today()
            )
            ->where('status', 'pending')
            ->get();

        foreach ($todayArrivals as $booking) {

            $booking->update([
                'status' => 'confirmed'
            ]);

            $this->info(
                'Confirmed booking: ' .
                $booking->booking_reference
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RELEASE UNUSED ROOMS
        |--------------------------------------------------------------------------
        */

        $unusedRooms = Room::where('status', 'occupied')
            ->whereDoesntHave('bookings', function ($query) {
                $query->where('status', 'checked_in');
            })
            ->get();

        foreach ($unusedRooms as $room) {

            $room->update([
                'status' => 'available'
            ]);

            $this->info(
                'Released room: ' .
                $room->room_number
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NIGHT AUDIT COMPLETE
        |--------------------------------------------------------------------------
        */

        $this->info('Night Audit Completed Successfully.');

        return Command::SUCCESS;
    }
}
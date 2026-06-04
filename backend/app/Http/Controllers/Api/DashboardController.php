<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Room;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalRooms = Room::where('is_active', true)->count();
        $today = Carbon::today()->toDateString();

        // Bookings that physically occupy a room today: any non-cancelled
        // booking whose stay window includes today, plus all checked_in
        // bookings whose window hasn't ended yet.
        $occupiedRoomIds = Booking::query()
            ->where('status', '!=', 'cancelled')
            ->where('check_in_date', '<=', $today)
            ->where('check_out_date', '>', $today)
            ->pluck('room_id')
            ->unique();

        $occupiedRooms = $occupiedRoomIds->count();

        $availableRooms = max(0, $totalRooms - $occupiedRooms);

        $occupancyRate = $totalRooms > 0
            ? round(($occupiedRooms / $totalRooms) * 100, 2)
            : 0;

        // Housekeeping-driven statuses still come from rooms.status because
        // they're set by the housekeeping flow, not by bookings.
        $dirtyRooms = Room::where('status', 'dirty')->count();
        $cleaningRooms = Room::where('status', 'cleaning')->count();
        $maintenanceRooms = Room::where('status', 'maintenance')->count();

        // Revenue is the sum of payments for non-cancelled bookings, with
        // the booking's total_price as the fallback when no payments have
        // been recorded yet (e.g. freshly created bookings).
        $paymentRevenue = Payment::query()
            ->whereHas('booking', fn ($q) => $q->where('status', '!=', 'cancelled'))
            ->sum('amount');

        $bookedRevenue = (float) Booking::query()
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('payments')
            ->sum('total_price');

        $totalRevenue = (float) $paymentRevenue + $bookedRevenue;

        $todayRevenue = $this->revenueForDate(Carbon::today());
        $monthlyRevenue = $this->revenueForPeriod(
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth(),
        );
        $yearlyRevenue = $this->revenueForPeriod(
            Carbon::now()->startOfYear(),
            Carbon::now()->endOfYear(),
        );

        $monthlyBookings = Booking::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return $this->success('Dashboard stats retrieved successfully', [
            'total_rooms' => $totalRooms,
            'total_guests' => Guest::count(),
            'total_bookings' => Booking::count(),

            'available_rooms' => $availableRooms,
            'occupied_rooms' => $occupiedRooms,
            'dirty_rooms' => $dirtyRooms,
            'cleaning_rooms' => $cleaningRooms,
            'maintenance_rooms' => $maintenanceRooms,

            'checked_in_bookings' => Booking::where('status', 'checked_in')->count(),
            'pending_bookings' => Booking::whereIn('status', ['pending', 'confirmed'])->count(),
            'checked_out_bookings' => Booking::where('status', 'checked_out')->count(),
            'cancelled_bookings' => Booking::where('status', 'cancelled')->count(),

            'today_revenue' => $todayRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'yearly_revenue' => $yearlyRevenue,
            'total_revenue' => $totalRevenue,

            'occupancy_rate' => $occupancyRate . '%',

            'monthly_booking_trends' => $monthlyBookings,
        ]);
    }

    private function revenueForDate(Carbon $date): float
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();

        $paymentSum = (float) Payment::query()
            ->whereBetween('paid_at', [$start, $end])
            ->sum('amount');

        // Bookings whose check-in landed on this day and have no payments yet.
        $bookingSum = (float) Booking::query()
            ->whereDate('check_in_date', $date->toDateString())
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('payments')
            ->sum('total_price');

        return $paymentSum + $bookingSum;
    }

    private function revenueForPeriod(Carbon $start, Carbon $end): float
    {
        $paymentSum = (float) Payment::query()
            ->whereBetween('paid_at', [$start, $end])
            ->sum('amount');

        $bookingSum = (float) Booking::query()
            ->whereBetween('check_in_date', [$start->toDateString(), $end->toDateString()])
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('payments')
            ->sum('total_price');

        return $paymentSum + $bookingSum;
    }
}

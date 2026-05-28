<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Guest;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalRooms = Room::count();

        $occupiedRooms = Room::where('status', 'occupied')->count();

        $occupancyRate = $totalRooms > 0
            ? round(($occupiedRooms / $totalRooms) * 100, 2)
            : 0;

        $monthlyRevenue = Payment::whereMonth('created_at', now()->month)
            ->sum('amount');

        $todayRevenue = Payment::whereDate('created_at', today())
            ->sum('amount');

        $monthlyBookings = Booking::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return $this->success('Dashboard stats retrieved successfully', [

            // BASIC STATS
            'total_rooms' => $totalRooms,
            'total_guests' => Guest::count(),
            'total_bookings' => Booking::count(),

            // ROOM STATUS
            'available_rooms' => Room::where('status', 'available')->count(),

            'occupied_rooms' => $occupiedRooms,

            'dirty_rooms' => Room::where('status', 'dirty')->count(),

            'cleaning_rooms' => Room::where('status', 'cleaning')->count(),

            'maintenance_rooms' => Room::where('status', 'maintenance')->count(),

            // BOOKING STATUS
            'checked_in_bookings' => Booking::where('status', 'checked_in')->count(),

            'pending_bookings' => Booking::where('status', 'pending')->count(),

            'checked_out_bookings' => Booking::where('status', 'checked_out')->count(),

            'cancelled_bookings' => Booking::where('status', 'cancelled')->count(),

            // REVENUE
            'today_revenue' => $todayRevenue,

            'monthly_revenue' => $monthlyRevenue,

            'total_revenue' => Payment::sum('amount'),

            // OCCUPANCY
            'occupancy_rate' => $occupancyRate . '%',

            // ANALYTICS
            'monthly_booking_trends' => $monthlyBookings
        ]);
    }
}

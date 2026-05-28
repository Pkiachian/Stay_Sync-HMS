<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Room;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | REVENUE REPORT
    |--------------------------------------------------------------------------
    */
    public function revenue()
    {
        return $this->success('Revenue report retrieved successfully', [

            'total_revenue' => Payment::sum('amount'),

            'today_revenue' => Payment::whereDate(
                'created_at',
                today()
            )->sum('amount'),

            'monthly_revenue' => Payment::whereMonth(
                'created_at',
                now()->month
            )->sum('amount'),

            'yearly_revenue' => Payment::whereYear(
                'created_at',
                now()->year
            )->sum('amount'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING REPORT
    |--------------------------------------------------------------------------
    */
    public function bookings()
    {
        return $this->success('Booking report retrieved successfully', [

            'total_bookings' => Booking::count(),

            'confirmed' => Booking::where(
                'status',
                'confirmed'
            )->count(),

            'checked_in' => Booking::where(
                'status',
                'checked_in'
            )->count(),

            'checked_out' => Booking::where(
                'status',
                'checked_out'
            )->count(),

            'cancelled' => Booking::where(
                'status',
                'cancelled'
            )->count(),

            'pending' => Booking::where(
                'status',
                'pending'
            )->count(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | OCCUPANCY REPORT
    |--------------------------------------------------------------------------
    */
    public function occupancy()
    {
        $totalRooms = Room::count();

        $occupiedRooms = Room::where(
            'status',
            'occupied'
        )->count();

        $occupancyRate = $totalRooms > 0
            ? round(($occupiedRooms / $totalRooms) * 100, 2)
            : 0;

        return $this->success('Occupancy report retrieved successfully', [

            'total_rooms' => $totalRooms,

            'occupied_rooms' => $occupiedRooms,

            'available_rooms' => Room::where(
                'status',
                'available'
            )->count(),

            'dirty_rooms' => Room::where(
                'status',
                'dirty'
            )->count(),

            'maintenance_rooms' => Room::where(
                'status',
                'maintenance'
            )->count(),

            'occupancy_rate' => $occupancyRate . '%',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MONTHLY REVENUE ANALYTICS
    |--------------------------------------------------------------------------
    */
    public function monthlyRevenue()
    {
        $revenue = Payment::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return $this->success('Monthly revenue report retrieved successfully', $revenue);
    }

    /*
    |--------------------------------------------------------------------------
    | MONTHLY BOOKING ANALYTICS
    |--------------------------------------------------------------------------
    */
    public function monthlyBookings()
    {
        $bookings = Booking::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return $this->success('Monthly bookings report retrieved successfully', $bookings);
    }
}

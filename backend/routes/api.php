<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\GuestController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\HousekeepingTaskController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RateOverrideController;
use App\Http\Controllers\Api\RoomTypeController;

// PUBLIC ROUTES
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// PROTECTED ROUTES
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('role:admin,staff')->group(function () {
        Route::apiResource('rooms', RoomController::class)->only(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->only(['index', 'show']);
        Route::apiResource('guests', GuestController::class);
        Route::apiResource('bookings', BookingController::class);
        Route::apiResource('housekeeping-tasks', HousekeepingTaskController::class);
        Route::apiResource('payments', PaymentController::class);

        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/available-rooms', [BookingController::class, 'availableRooms']);
        Route::get('/booking-calendar', [BookingController::class, 'calendar']);
        Route::get('/bookings/{id}/invoice', [BookingController::class, 'invoice']);
        Route::post('/bookings/{id}/check-in', [BookingController::class, 'checkIn']);
        Route::post('/bookings/{id}/check-out', [BookingController::class, 'checkOut']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('rooms', RoomController::class)->except(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->except(['index', 'show']);
        Route::apiResource('rate-overrides', RateOverrideController::class);

        Route::get('/reports/revenue', [ReportController::class, 'revenue']);
        Route::get('/reports/bookings', [ReportController::class, 'bookings']);
        Route::get('/reports/occupancy', [ReportController::class, 'occupancy']);
        Route::get('/reports/monthly-revenue', [ReportController::class, 'monthlyRevenue']);
        Route::get('/reports/monthly-bookings', [ReportController::class, 'monthlyBookings']);
    });
});

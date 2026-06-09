<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomStatusLogController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\GuestController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\HousekeepingTaskController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RateOverrideController;
use App\Http\Controllers\Api\RoomServiceOrderStaffController;
use App\Http\Controllers\Api\RoomTypeController;
use App\Http\Controllers\Api\AboutController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\MpesaController;
use App\Http\Controllers\Api\PortalController;
use App\Http\Controllers\Api\Portal\ChatController as PortalChatController;
use App\Http\Controllers\Api\Portal\ServiceRequestController as PortalServiceRequestController;
use App\Http\Controllers\Api\Portal\LoyaltyController as PortalLoyaltyController;
use App\Http\Controllers\Api\ServiceRequestStaffController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (No Auth Required)
|--------------------------------------------------------------------------
*/
Route::post('/login',        [SessionController::class, 'login'])->middleware('throttle:login');
Route::post('/login/resend', [SessionController::class, 'resendOtp'])->middleware('throttle:resend-otp');
Route::post('/verify-otp',   [SessionController::class, 'verifyOtp'])->middleware('throttle:verify-otp');

// About & Contact — publicly accessible
Route::get('/about',    [AboutController::class,  'index']);
Route::get('/contact',  [ContactController::class, 'index']);
Route::post('/contact', [ContactController::class, 'store']);

// M-Pesa callback — must be public (Safaricom calls this directly)
Route::post('/mpesa/callback', [MpesaController::class, 'callback']);

// Guest self-service portal — public landing, room browsing, and booking flow
Route::prefix('portal')->group(function () {
    Route::get('room-types',            [PortalController::class, 'getRoomTypes']);
    Route::get('available-rooms',       [PortalController::class, 'getAvailableRooms']);
    Route::post('bookings',             [PortalController::class, 'createBooking']);
    Route::get('bookings/lookup',       [PortalController::class, 'lookupBooking']);
    Route::post('bookings/{id}/cancel', [PortalController::class, 'cancelBooking']);
    Route::get('bookings/{id}/invoice', [PortalController::class, 'invoice']);
    Route::post('pay',                  [PortalController::class, 'stkPush']);
    Route::post('service-requests',     [PortalServiceRequestController::class, 'store']);
    Route::get('loyalty',               [PortalLoyaltyController::class, 'show']);

    // Guest help chat (LLM-backed, no auth, falls back gracefully if no key)
    Route::post('chat',                  [PortalChatController::class, 'ask']);

    // Room service
    Route::get('room-service/menu',                     [PortalController::class, 'roomServiceMenu']);
    Route::post('room-service/orders',                 [PortalController::class, 'createRoomServiceOrder']);
    Route::get('room-service/orders/lookup',           [PortalController::class, 'lookupRoomServiceOrder']);
});

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Auth Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Session
    Route::get('/user',           [SessionController::class, 'me']);     // legacy alias
    Route::get('/me',             [SessionController::class, 'me']);
    Route::post('/logout',        [SessionController::class, 'logout']);
    Route::post('/session/refresh', [SessionController::class, 'refresh']);

    // Admin-only: create staff accounts
    Route::middleware('role:admin')->group(function () {
        Route::post('/register', [SessionController::class, 'register']);
    });

    // M-Pesa STK Push — auth required to initiate payment
    Route::post('/mpesa/initiate', [MpesaController::class, 'initiate']);

    /*
    |----------------------------------------------------------------------
    | Admin + Staff Routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin,manager,receptionist,housekeeper')->group(function () {

        // Rooms & Room Types (read only for staff)
        Route::apiResource('rooms',      RoomController::class)->only(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->only(['index', 'show']);

        // Full CRUD
        Route::apiResource('guests',             GuestController::class);
        Route::apiResource('bookings',           BookingController::class);
        Route::apiResource('housekeeping-tasks', HousekeepingTaskController::class);
        Route::apiResource('payments',           PaymentController::class);

        // Concierge / service requests inbox
        Route::get('service-requests',            [ServiceRequestStaffController::class, 'index']);
        Route::patch('service-requests/{id}',     [ServiceRequestStaffController::class, 'update']);

        // Room service orders (kitchen fulfilment)
        Route::get('room-service-orders',         [RoomServiceOrderStaffController::class, 'index']);
        Route::patch('room-service-orders/{id}',  [RoomServiceOrderStaffController::class, 'update']);

        // Room status change history
        Route::get('room-status-logs', [RoomStatusLogController::class, 'index']);

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

        // Global search
        Route::get('/search', [SearchController::class, 'index']);

        // Booking Actions
        Route::get('/available-rooms',            [BookingController::class, 'availableRooms']);
        Route::get('/booking-calendar',           [BookingController::class, 'calendar']);
        Route::get('/bookings/{id}/invoice',      [BookingController::class, 'invoice']);
        Route::post('/bookings/{id}/check-in',    [BookingController::class, 'checkIn']);
        Route::post('/bookings/{id}/check-out',   [BookingController::class, 'checkOut']);
    });

    /*
    |----------------------------------------------------------------------
    | Admin Only Routes
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {

        // Rooms & Room Types (write for admin)
        Route::apiResource('rooms',      RoomController::class)->except(['index', 'show']);
        Route::apiResource('room-types', RoomTypeController::class)->except(['index', 'show']);

        // Rate Overrides
        Route::apiResource('rate-overrides', RateOverrideController::class);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/revenue',          [ReportController::class, 'revenue']);
            Route::get('/bookings',         [ReportController::class, 'bookings']);
            Route::get('/occupancy',        [ReportController::class, 'occupancy']);
            Route::get('/monthly-revenue',  [ReportController::class, 'monthlyRevenue']);
            Route::get('/monthly-bookings', [ReportController::class, 'monthlyBookings']);
            Route::get('/pdf',              [ReportController::class, 'pdf']);
        });

        // Hotel settings
        Route::get('/settings',  [SettingsController::class, 'index']);
        Route::put('/settings',  [SettingsController::class, 'update']);
    });
});

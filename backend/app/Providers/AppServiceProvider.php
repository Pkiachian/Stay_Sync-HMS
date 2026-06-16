<?php

namespace App\Providers;

use App\Models\Room;
use App\Observers\RoomObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Room::observe(RoomObserver::class);

        $this->registerRateLimiters();
    }

    private function registerRateLimiters(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $email = strtolower((string) $request->input('email', ''));
            return Limit::perMinutes(15, 10)->by($email . '|' . $request->ip());
        });

        RateLimiter::for('verify-otp', function (Request $request) {
            return Limit::perMinutes(15, 20)->by($request->ip());
        });

        RateLimiter::for('resend-otp', function (Request $request) {
            return Limit::perHour(5)->by($request->ip());
        });

        // Public portal booking lookup — caps brute-force attempts at
        // guessing (reference, last_name) pairs. Bypassed for staff auth.
        RateLimiter::for('portal-lookup', function (Request $request) {
            $ref = strtolower((string) $request->query('reference', ''));
            return Limit::perMinutes(5, 10)->by($ref . '|' . $request->ip());
        });
    }
}

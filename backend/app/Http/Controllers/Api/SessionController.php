<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\OtpInvalidException;
use App\Http\Controllers\Controller;
use App\Models\LoginOtp;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SessionController extends Controller
{
    /**
     * The single source of truth for which paths each role can visit.
     * Mirrors `src/app/router.tsx:ROLE_PAGES` so the SPA can drive gating
     * from the server-side role instead of hardcoding it client-side.
     *
     * 'admin' gets '*' which the SPA treats as "all paths".
     */
    private const ROLE_PAGES = [
        'admin'        => ['*'],
        'manager'      => [
            '/', '/tape-chart', '/bookings', '/housekeeping', '/room-status-log',
            '/concierge-inbox', '/room-service-orders', '/guests', '/reports',
            '/rate-overrides', '/about', '/contact',
        ],
        'receptionist' => [
            '/', '/tape-chart', '/bookings', '/concierge-inbox', '/room-service-orders',
            '/guests', '/about', '/contact',
        ],
        'housekeeper'  => [
            '/', '/housekeeping', '/room-status-log', '/about', '/contact',
        ],
    ];

    /** Where to send each role after a successful login. */
    private const ROLE_HOME = [
        'admin'        => '/',
        'manager'      => '/reports',
        'receptionist' => '/bookings',
        'housekeeper'  => '/housekeeping',
    ];

    /**
     * POST /api/login — step 1 of the 2FA flow.
     * Validates email+password, then issues an OTP and emails it.
     * Returns the raw otp_token that the client passes to /verify-otp.
     * No Sanctum token is issued here.
     */
    public function login(Request $request, OtpService $otp)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return $this->error('Wrong email or password', null, 401);
        }

        $issued = $otp->issue(
            $user,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success('OTP sent', [
            'requires_otp' => true,
            'otp_token'    => $issued['otp_token'],
        ]);
    }

    /**
     * POST /api/verify-otp — step 2 of the 2FA flow.
     * On success, issues the Sanctum token and returns the same session
     * payload shape that the old one-step login returned.
     */
    public function verifyOtp(Request $request, OtpService $otp)
    {
        $data = $request->validate([
            'otp_token' => 'required|string',
            'code'      => 'required|string|size:6|regex:/^\d{6}$/',
        ]);

        try {
            $row = $otp->verify($data['otp_token'], $data['code']);
        } catch (OtpInvalidException $e) {
            return $this->error($this->otpErrorMessage($e), null, 422);
        }

        $user = $row->user;
        $token = $user->createToken('staff:' . $user->role)->plainTextToken;

        return $this->success('Login successful', $this->sessionPayload($user, $token));
    }

    /**
     * POST /api/login/resend — issues a fresh OTP for an existing
     * otp_token and invalidates the old code. Always returns a generic
     * success message so an attacker can't enumerate valid otp_tokens.
     */
    public function resendOtp(Request $request, OtpService $otp)
    {
        $data = $request->validate([
            'otp_token' => 'required|string',
        ]);

        $row = LoginOtp::where('otp_token', hash('sha256', $data['otp_token']))->first();

        if ($row && !$row->isConsumed() && !$row->isExpired()) {
            $otp->consume($row);
            $otp->issue($row->user, $request->ip(), $request->userAgent());
        }

        return $this->success('If the code is still valid, a new one has been sent.');
    }

    private function otpErrorMessage(OtpInvalidException $e): string
    {
        return match ($e->reason) {
            OtpInvalidException::REASON_NOT_FOUND => 'Verification session expired. Please log in again.',
            OtpInvalidException::REASON_EXPIRED   => 'Code expired. Please log in again.',
            OtpInvalidException::REASON_EXHAUSTED => 'Too many failed attempts. Please log in again.',
            OtpInvalidException::REASON_CONSUMED  => 'This code has already been used.',
            OtpInvalidException::REASON_BAD_CODE  => "Incorrect code. {$e->remainingAttempts} attempts remaining.",
            default => 'Verification failed.',
        };
    }

    /** POST /api/logout — auth required. Revokes the current token. */
    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) {
            $token->delete();
        }
        return $this->success('Logged out');
    }

    /** GET /api/me — auth required. */
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Unauthenticated', null, 401);
        }

        return $this->success('Session active', $this->sessionPayload($user));
    }

    /**
     * POST /api/session/refresh — auth required. Rotates the current token.
     * Useful for long-lived sessions (e.g. front desk kiosk) so a single
     * token doesn't have to live forever.
     */
    public function refresh(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Unauthenticated', null, 401);
        }

        $current = $user->currentAccessToken();
        $newToken = $user->createToken('staff:' . $user->role)->plainTextToken;

        if ($current) {
            $current->delete();
        }

        return $this->success('Session refreshed', $this->sessionPayload($user, $newToken));
    }

    /**
     * POST /api/register — admin-only. Lets a manager create a staff
     * account (receptionist, housekeeper) without going through the seeder.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:120',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,manager,receptionist,housekeeper',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
        ]);

        $token = $user->createToken('staff:' . $user->role)->plainTextToken;

        return $this->success('User registered successfully', $this->sessionPayload($user, $token), 201);
    }

    /**
     * Shape used by /login, /me, /refresh, /register responses so the SPA
     * can update its auth store from any of them.
     */
    private function sessionPayload(User $user, ?string $token = null): array
    {
        $role = (string) $user->role;
        $payload = [
            'user'         => $user,
            'role'         => $role,
            'permissions'  => self::ROLE_PAGES[$role] ?? [],
            'redirect_to'  => self::ROLE_HOME[$role] ?? '/',
        ];

        if ($token !== null) {
            $payload['token'] = $token;
        }

        return $payload;
    }
}

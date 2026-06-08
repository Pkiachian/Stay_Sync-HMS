<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
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

    /** POST /api/login — public. */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return $this->error('Wrong email or password', null, 401);
        }

        // Old tokens are kept — staff can be signed in from multiple devices
        // (front desk kiosk, manager laptop, etc). The /refresh endpoint
        // rotates the current one if needed.
        $token = $user->createToken('staff:' . $user->role)->plainTextToken;

        return $this->success('Login successful', $this->sessionPayload($user, $token));
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

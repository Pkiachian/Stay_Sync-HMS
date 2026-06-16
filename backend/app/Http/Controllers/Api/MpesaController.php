<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MpesaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    public function __construct(protected MpesaService $mpesa) {}

    // Initiate STK Push
    public function initiate(Request $request)
    {
        $request->validate([
            'phone'     => 'required|string',
            'amount'    => 'required|integer|min:1',
            'reference' => 'required|string', // e.g. booking ID
        ]);

        $result = $this->mpesa->stkPush(
            $request->phone,
            $request->amount,
            $request->reference
        );

        return response()->json($result);
    }

    /**
     * Safaricom sends payment result here.
     *
     * Secured by a shared secret header (MPESA_CALLBACK_SECRET in .env).
     * Safaricom doesn't sign callbacks natively, so this is the lightest
     * reliable guard: if the URL leaks, attackers still need the secret.
     * In dev with no secret set, we accept the callback (otherwise local
     * testing with sandbox becomes impossible).
     */
    public function callback(Request $request)
    {
        $expected = config('services.mpesa.callback_secret') ?? env('MPESA_CALLBACK_SECRET');

        if (!empty($expected)) {
            $provided = $request->header('X-StaySync-Signature', '');
            if (!hash_equals((string) $expected, (string) $provided)) {
                Log::warning('M-Pesa callback rejected: bad or missing signature', [
                    'ip' => $request->ip(),
                ]);
                return response()->json(['ResultCode' => 1, 'ResultDesc' => 'Unauthorized'], 401);
            }
        }

        $this->mpesa->handleCallback($request->all());
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    }
}
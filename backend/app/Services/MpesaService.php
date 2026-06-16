<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService
{
    protected string $baseUrl;
    protected string $consumerKey;
    protected string $consumerSecret;
    protected string $shortcode;
    protected string $passkey;
    protected string $callbackUrl;

    /**
     * The most-recent purpose we were asked to issue an STK push for
     * (e.g. "deposit" vs "full"). Read by the callback when the same push
     * comes back, so the resulting Payment row is tagged correctly.
     */
    private string $pendingPurpose = 'deposit';

    public function __construct()
    {
        $this->baseUrl        = config('mpesa.base_url');
        $this->consumerKey    = config('mpesa.consumer_key');
        $this->consumerSecret = config('mpesa.consumer_secret');
        $this->shortcode      = config('mpesa.shortcode');
        $this->passkey        = config('mpesa.passkey');
        $this->callbackUrl    = config('mpesa.callback_url');
    }

    // Step 1: Get OAuth Token
    public function getAccessToken(): string
    {
        $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
            ->get("{$this->baseUrl}/oauth/v1/generate?grant_type=client_credentials");

        return $response->json('access_token');
    }

    // Step 2: STK Push (Lipa Na M-Pesa)
    public function stkPush(string $phone, int $amount, string $reference, string $purpose = 'deposit'): array
    {
        $token     = $this->getAccessToken();
        $timestamp = now()->format('YmdHis');
        $password  = base64_encode($this->shortcode . $this->passkey . $timestamp);

        // Normalize phone to 2547XXXXXXXX (Safaricom's required format).
        // Accepts: 0712345678, +254712345678, 254712345678, 712345678.
        $digits = preg_replace('/\D+/', '', $phone);
        $phone  = str_starts_with($digits, '254') ? $digits : '254' . ltrim($digits, '0');

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/mpesa/stkpush/v1/processrequest", [
                'BusinessShortCode' => $this->shortcode,
                'Password'          => $password,
                'Timestamp'         => $timestamp,
                'TransactionType'   => 'CustomerPayBillOnline',
                'Amount'            => $amount,
                'PartyA'            => $phone,
                'PartyB'            => $this->shortcode,
                'PhoneNumber'       => $phone,
                'CallBackURL'       => $this->callbackUrl,
                'AccountReference'  => $reference,
                'TransactionDesc'   => "Payment for {$reference}",
            ]);

        $body = $response->json() ?? [];

        // Capture the CheckoutRequestID so the callback can match this push
        // to the resulting payment row, even if no pending row exists yet.
        // The purpose (deposit/full) is stored alongside so the callback
        // can record the right description.
        $this->pendingPurpose = $purpose;
        if (isset($body['CheckoutRequestID']) && isset($body['MerchantRequestID'])) {
            $this->recordCheckoutId($reference, $body['CheckoutRequestID'], $body['MerchantRequestID'], $purpose);
        }

        return $body;
    }

    // Step 3: Handle Callback from Safaricom
    public function handleCallback(array $data): void
    {
        $result = $data['Body']['stkCallback'] ?? null;
        if (!$result) {
            Log::warning('M-Pesa callback missing stkCallback body', ['data' => $data]);
            return;
        }

        $checkoutId      = $result['CheckoutRequestID']      ?? null;
        $merchantId      = $result['MerchantRequestID']      ?? null;
        $accountReference = $result['AccountReference']      ?? null;

        if ($result['ResultCode'] === 0) {
            $metadata = collect($result['CallbackMetadata']['Item'] ?? []);
            $transactionId = $metadata->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;
            $amount        = (float) ($metadata->firstWhere('Name', 'Amount')['Value']        ?? 0);
            $phone         = $metadata->firstWhere('Name', 'PhoneNumber')['Value']             ?? null;

            Log::info('M-Pesa Payment Success', compact('checkoutId', 'merchantId', 'transactionId', 'amount', 'phone', 'accountReference'));

            // Resolve the booking first so we can read the pending row's
            // purpose — the in-process $pendingPurpose may be stale because
            // the callback can run in a different request than the push.
            $bookingForPurpose = $this->resolveBooking($accountReference);
            $purpose = $this->pendingPurpose;
            if ($bookingForPurpose) {
                $pendingRow = Payment::query()
                    ->where('booking_id', $bookingForPurpose->id)
                    ->where('status', 'pending')
                    ->where('transaction_reference', $checkoutId)
                    ->first();
                if ($pendingRow && !empty($pendingRow->purpose)) {
                    $purpose = $pendingRow->purpose;
                }
            }

            $this->recordPayment([
                'booking_reference' => $accountReference,
                'checkout_id'       => $checkoutId,
                'merchant_id'       => $merchantId,
                'transaction_id'    => $transactionId,
                'amount'            => $amount,
                'phone'             => $phone,
            ], $purpose);
        } else {
            Log::warning('M-Pesa Payment Failed', [
                'checkoutId' => $checkoutId,
                'merchantId' => $merchantId,
                'result'     => $result,
            ]);
        }
    }

    /**
     * Find the booking that this STK push was for (its ID was sent as
     * AccountReference), then either mark an existing pending Payment row
     * as paid or create a new completed one. $purpose is 'deposit' or
     * 'full' and is persisted onto the row so the receptionist can see
     * whether the balance is still owed.
     */
    private function recordPayment(array $info, string $purpose = 'deposit'): ?Payment
    {
        $booking = $this->resolveBooking($info['booking_reference']);
        if (!$booking) {
            Log::error('M-Pesa callback: could not resolve booking', $info);
            return null;
        }

        // Prefer matching an existing pending Payment by the checkout id
        // we stashed at stkPush time, so concurrent payments on the same
        // booking don't get merged into one row.
        $pending = null;
        if (!empty($info['checkout_id'])) {
            $pending = Payment::query()
                ->where('booking_id', $booking->id)
                ->where('status', 'pending')
                ->where('transaction_reference', $info['checkout_id'])
                ->first();
        }

        // Fallback: the most recent pending payment for this booking.
        if (!$pending) {
            $pending = Payment::query()
                ->where('booking_id', $booking->id)
                ->where('status', 'pending')
                ->latest('id')
                ->first();
        }

        if ($pending) {
            $pending->update([
                'status'                => 'completed',
                'purpose'               => $purpose,
                'transaction_reference' => $info['transaction_id'] ?? $info['checkout_id'] ?? $pending->transaction_reference,
                'paid_at'               => now(),
            ]);
            Log::info('M-Pesa: marked pending Payment as completed', ['payment_id' => $pending->id, 'purpose' => $purpose]);
            return $pending;
        }

        // No pending row — create a completed one.
        $created = Payment::create([
            'booking_id'           => $booking->id,
            'amount'               => $info['amount'] ?? 0,
            'payment_method'       => 'mpesa',
            'transaction_reference'=> $info['transaction_id'] ?? $info['checkout_id'] ?? null,
            'status'               => 'completed',
            'purpose'              => $purpose,
            'paid_at'              => now(),
        ]);
        Log::info('M-Pesa: created completed Payment row', ['payment_id' => $created->id, 'purpose' => $purpose]);
        return $created;
    }

    /**
     * Resolve a booking from the AccountReference sent with the STK push.
     * Accepts either a numeric booking ID or a booking_reference code.
     */
    private function resolveBooking(?string $reference): ?Booking
    {
        if (!$reference) return null;
        if (ctype_digit($reference)) {
            return Booking::find((int) $reference);
        }
        return Booking::where('booking_reference', $reference)->first();
    }

    /**
     * Stash the CheckoutRequestID on a pending Payment row (if one exists for
     * the booking) so the callback can find the exact row. If no pending
     * Payment exists, we do nothing — the callback will create one. The
     * purpose is persisted on the row so the callback — which can land
     * after a fresh service instance is built — still has it.
     */
    private function recordCheckoutId(string $reference, string $checkoutId, string $merchantId, string $purpose = 'deposit'): void
    {
        $booking = $this->resolveBooking($reference);
        if (!$booking) return;

        $pending = Payment::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        if ($pending) {
            $pending->update([
                'transaction_reference' => $checkoutId,
                'purpose'               => $pending->purpose ?? $purpose,
            ]);
        } else {
            // Create a pending row so the callback has a target.
            Payment::create([
                'booking_id'           => $booking->id,
                'amount'               => 0, // filled in at callback time
                'payment_method'       => 'mpesa',
                'transaction_reference'=> $checkoutId,
                'status'               => 'pending',
                'purpose'              => $purpose,
            ]);
        }
    }
}
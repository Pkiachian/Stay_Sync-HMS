<?php

namespace App\Services;

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
    public function stkPush(string $phone, int $amount, string $reference): array
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

        return $response->json() ?? [];
    }

    // Step 3: Handle Callback from Safaricom
    public function handleCallback(array $data): void
    {
        $result = $data['Body']['stkCallback'];

        if ($result['ResultCode'] === 0) {
            // Payment successful
            $metadata = collect($result['CallbackMetadata']['Item']);

            $transactionId = $metadata->firstWhere('Name', 'MpesaReceiptNumber')['Value'];
            $amount        = $metadata->firstWhere('Name', 'Amount')['Value'];
            $phone         = $metadata->firstWhere('Name', 'PhoneNumber')['Value'];

            Log::info('M-Pesa Payment Success', compact('transactionId', 'amount', 'phone'));

            // TODO: update your payments table here
            // Payment::where('reference', ...)->update(['status' => 'paid', ...]);

        } else {
            Log::warning('M-Pesa Payment Failed', ['result' => $result]);
        }
    }
}
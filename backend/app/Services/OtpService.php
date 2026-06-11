<?php

namespace App\Services;

use App\Exceptions\OtpInvalidException;
use App\Models\AuditLog;
use App\Models\LoginOtp;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OtpService
{
    /** @var callable():string */
    private $codeGenerator;

    public function __construct(?callable $codeGenerator = null)
    {
        $this->codeGenerator = $codeGenerator ?? static fn (): string => (string) random_int(100000, 999999);
    }

    /**
     * Issue a new OTP for the given user. Invalidates any unconsumed OTPs
     * for the user first so a fresh login cannot be replayed against an
     * older otp_token. Returns the raw otp_token to be returned to the
     * client (the DB stores only its sha256 hash).
     */
    public function issue(User $user, ?string $ip = null, ?string $userAgent = null): array
    {
        $rawToken = Str::random(40);
        $code     = ($this->codeGenerator)();

        $otp = DB::transaction(function () use ($user, $rawToken, $code, $ip, $userAgent) {
            LoginOtp::where('user_id', $user->id)
                ->whereNull('consumed_at')
                ->delete();

            return LoginOtp::create([
                'user_id'    => $user->id,
                'otp_token'  => hash('sha256', $rawToken),
                'code_hash'  => Hash::make($code),
                'attempts'   => 0,
                'expires_at' => now()->addMinutes(LoginOtp::TTL_MINUTES),
                'ip'         => $ip,
                'user_agent' => $userAgent !== null ? Str::limit($userAgent, 255, '') : null,
            ]);
        });

        $this->sendMail($user, $code);

        $this->audit($user->id, 'otp.issued', [
            'otp_id'  => $otp->id,
            'expires' => $otp->expires_at->toIso8601String(),
        ], $ip);

        return [
            'otp_token' => $rawToken,
            'login_otp' => $otp,
        ];
    }

    /**
     * Verify a submitted code against the otp_token. Throws
     * OtpInvalidException on any failure. On success, marks the row
     * consumed and returns the LoginOtp model (caller issues the
     * Sanctum token).
     */
    public function verify(string $rawOtpToken, string $code): LoginOtp
    {
        $otp = LoginOtp::where('otp_token', hash('sha256', $rawOtpToken))->first();

        if (!$otp) {
            throw new OtpInvalidException(OtpInvalidException::REASON_NOT_FOUND);
        }

        if ($otp->isConsumed()) {
            throw new OtpInvalidException(OtpInvalidException::REASON_CONSUMED);
        }

        if ($otp->isExpired()) {
            $this->audit($otp->user_id, 'otp.expired', ['otp_id' => $otp->id], $otp->ip);
            throw new OtpInvalidException(OtpInvalidException::REASON_EXPIRED);
        }

        if ($otp->isExhausted()) {
            DB::transaction(function () use ($otp) {
                $otp->delete();
            });
            $this->audit($otp->user_id, 'otp.exhausted', ['otp_id' => $otp->id], $otp->ip);
            throw new OtpInvalidException(OtpInvalidException::REASON_EXHAUSTED);
        }

        if (!Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');
            $remaining = max(LoginOtp::MAX_ATTEMPTS - $otp->attempts, 0);

            if ($remaining === 0) {
                DB::transaction(fn () => $otp->delete());
                $this->audit($otp->user_id, 'otp.exhausted', ['otp_id' => $otp->id], $otp->ip);
                throw new OtpInvalidException(
                    OtpInvalidException::REASON_EXHAUSTED,
                    0
                );
            }

            $this->audit($otp->user_id, 'otp.failed', [
                'otp_id'      => $otp->id,
                'remaining'   => $remaining,
            ], $otp->ip);

            throw new OtpInvalidException(
                OtpInvalidException::REASON_BAD_CODE,
                $remaining
            );
        }

        DB::transaction(function () use ($otp) {
            $otp->forceFill(['consumed_at' => now()])->save();
        });

        $this->audit($otp->user_id, 'otp.verified', ['otp_id' => $otp->id], $otp->ip);

        return $otp;
    }

    /**
     * Mark an OTP consumed (used by resend to invalidate a leaked code).
     */
    public function consume(LoginOtp $otp): void
    {
        if ($otp->isConsumed()) {
            return;
        }
        $otp->forceFill(['consumed_at' => now()])->save();
    }

    private function sendMail(User $user, string $code): void
    {
        $body = "Hi {$user->name},\n\n"
            . "Your StaySync verification code is: {$code}\n\n"
            . "This code expires in " . LoginOtp::TTL_MINUTES . " minutes. "
            . "If you did not request this, please change your password immediately.\n\n"
            . "— StaySync HMS";

        Mail::raw($body, function ($message) use ($user) {
            $message->to($user->email, $user->name)
                ->subject('Your StaySync login code');
        });
    }

    private function audit(?int $userId, string $event, array $meta = [], ?string $ip = null): void
    {
        AuditLog::create([
            'user_id'     => $userId,
            'action'      => $event,
            'description' => json_encode($meta, JSON_UNESCAPED_SLASHES),
            'created_at'  => now(),
        ]);
    }
}

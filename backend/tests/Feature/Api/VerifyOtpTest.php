<?php

namespace Tests\Feature\Api;

use App\Models\LoginOtp;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class VerifyOtpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function makeUserAndOtp(string $email = 'admin@example.com', string $password = 'password'): array
    {
        $user = User::factory()->create([
            'email'    => $email,
            'password' => Hash::make($password),
            'role'     => 'admin',
        ]);

        static $counter = 123456;
        $code = (string) $counter++;

        $this->app->instance(OtpService::class, new OtpService(
            static fn (): string => $code
        ));

        $otp = app(OtpService::class);
        $issued = $otp->issue($user, '127.0.0.1', 'PHPUnit');

        return [
            $user,
            $issued['otp_token'],
            LoginOtp::where('user_id', $user->id)->latest('id')->first(),
            $code,
        ];
    }

    public function test_correct_code_returns_session_payload_and_creates_sanctum_token(): void
    {
        [$user, $token, , $code] = $this->makeUserAndOtp();

        $this->postJson('/api/verify-otp', [
            'otp_token' => $token,
            'code'      => $code,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'role', 'permissions', 'redirect_to', 'token']]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'staff:admin',
        ]);
    }

    public function test_wrong_code_returns_422_and_increments_attempts(): void
    {
        [$user, $token] = $this->makeUserAndOtp();

        $this->postJson('/api/verify-otp', [
            'otp_token' => $token,
            'code'      => '000000',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Incorrect code. 4 attempts remaining.');

        $this->assertEquals(1, LoginOtp::where('user_id', $user->id)->value('attempts'));
    }

    public function test_otp_invalidates_after_five_failed_attempts(): void
    {
        [$user, $token] = $this->makeUserAndOtp();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/verify-otp', [
                'otp_token' => $token,
                'code'      => '000000',
            ])->assertStatus(422);
        }

        $this->assertDatabaseMissing('login_otps', ['user_id' => $user->id]);
    }

    public function test_expired_code_is_rejected(): void
    {
        [$user, $token, $row, $code] = $this->makeUserAndOtp();

        $row->forceFill(['expires_at' => now()->subMinute()])->save();

        $this->postJson('/api/verify-otp', [
            'otp_token' => $token,
            'code'      => $code,
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Code expired. Please log in again.');
    }

    public function test_already_consumed_code_cannot_be_replayed(): void
    {
        [$user, $token, , $code] = $this->makeUserAndOtp();

        $this->postJson('/api/verify-otp', [
            'otp_token' => $token,
            'code'      => $code,
        ])->assertOk();

        $this->postJson('/api/verify-otp', [
            'otp_token' => $token,
            'code'      => $code,
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'This code has already been used.');
    }

    public function test_unknown_otp_token_returns_422(): void
    {
        $this->postJson('/api/verify-otp', [
            'otp_token' => 'this-token-does-not-exist',
            'code'      => '123456',
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Verification session expired. Please log in again.');
    }

    public function test_resend_invalidates_old_otp_and_creates_new_one(): void
    {
        [$user, $token, , $oldCode] = $this->makeUserAndOtp();

        $this->postJson('/api/login/resend', ['otp_token' => $token])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson('/api/verify-otp', [
            'otp_token' => $token,
            'code'      => $oldCode,
        ])->assertStatus(422);
    }

    public function test_resend_with_unknown_token_returns_generic_success(): void
    {
        $this->postJson('/api/login/resend', ['otp_token' => 'never-issued'])
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}

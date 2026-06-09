<?php

namespace Tests\Feature\Api;

use App\Models\LoginOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginStep1Test extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        RateLimiter::clear('login|admin@example.com|127.0.0.1');
    }

    public function test_login_with_valid_credentials_returns_otp_token_and_no_sanctum_token(): void
    {
        User::factory()->create([
            'email'    => 'admin@example.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);

        $this->postJson('/api/login', [
            'email'    => 'admin@example.com',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.requires_otp', true)
            ->assertJsonStructure(['data' => ['requires_otp', 'otp_token']]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'name' => 'staff:admin',
        ]);
        $this->assertDatabaseCount('login_otps', 1);
    }

    public function test_login_with_invalid_password_returns_401_and_no_otp_row(): void
    {
        User::factory()->create([
            'email'    => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        $this->postJson('/api/login', [
            'email'    => 'admin@example.com',
            'password' => 'wrong',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('login_otps', 0);
    }

    public function test_login_with_unknown_email_returns_401(): void
    {
        $this->postJson('/api/login', [
            'email'    => 'nobody@example.com',
            'password' => 'password',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_login_response_does_not_include_sanctum_token(): void
    {
        User::factory()->create([
            'email'    => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'admin@example.com',
            'password' => 'password',
        ])->assertOk();

        $this->assertNull($response->json('data.token'));
        $this->assertNull($response->json('data.user'));
    }

    public function test_login_creates_a_login_otp_row_with_hashed_code(): void
    {
        $user = User::factory()->create([
            'email'    => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        $this->postJson('/api/login', [
            'email'    => 'admin@example.com',
            'password' => 'password',
        ])->assertOk();

        $row = LoginOtp::where('user_id', $user->id)->first();
        $this->assertNotNull($row);
        $this->assertNotEmpty($row->code_hash);
        $this->assertNotEmpty($row->otp_token);
        $this->assertEquals(0, $row->attempts);
        $this->assertNull($row->consumed_at);
        $this->assertTrue($row->expires_at->isFuture());
    }

    public function test_login_is_rate_limited_after_ten_attempts_per_email(): void
    {
        User::factory()->create([
            'email'    => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        $email = 'admin@example.com';

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/login', [
                'email'    => $email,
                'password' => 'wrong',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/login', [
            'email'    => $email,
            'password' => 'password',
        ])->assertStatus(429);
    }
}

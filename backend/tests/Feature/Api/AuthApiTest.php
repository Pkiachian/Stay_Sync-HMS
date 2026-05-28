<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_login_fetch_profile_and_logout(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Front Desk',
            'email' => 'frontdesk@example.com',
            'password' => 'password',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $login = $this->postJson('/api/login', [
            'email' => 'frontdesk@example.com',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $token = $login->json('data.token');

        $this->withToken($token)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_invalid_login_and_missing_token_return_standard_errors(): void
    {
        User::factory()->create([
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('success', false);

        $this->getJson('/api/rooms')
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Unauthenticated');
    }

    public function test_authenticated_staff_can_access_staff_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));

        $this->getJson('/api/rooms')
            ->assertOk()
            ->assertJsonPath('success', true);
    }
}

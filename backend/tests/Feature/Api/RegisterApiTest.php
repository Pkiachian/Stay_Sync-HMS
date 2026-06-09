<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegisterApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_staff_account_and_get_token(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/register', [
            'name'     => 'Front Desk',
            'email'    => 'frontdesk@example.com',
            'password' => 'password',
            'role'     => 'receptionist',
        ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', [
            'email' => 'frontdesk@example.com',
            'role'  => 'receptionist',
        ]);
    }

    public function test_register_requires_authentication(): void
    {
        $this->postJson('/api/register', [
            'name'     => 'Front Desk',
            'email'    => 'frontdesk@example.com',
            'password' => 'password',
            'role'     => 'receptionist',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_authenticated_staff_can_access_staff_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'receptionist']));

        $this->getJson('/api/rooms')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_unauthenticated_request_to_protected_route_returns_standard_error(): void
    {
        $this->getJson('/api/rooms')
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Unauthenticated');
    }
}

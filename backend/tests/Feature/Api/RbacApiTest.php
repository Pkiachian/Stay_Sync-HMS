<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_cannot_access_admin_only_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));

        $this->postJson('/api/room-types', [
            'name' => 'Executive',
            'base_price' => 200,
            'max_occupancy' => 2,
        ])
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Access denied');
    }

    public function test_admin_can_access_admin_only_routes(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson('/api/room-types', [
            'name' => 'Executive',
            'base_price' => 200,
            'max_occupancy' => 2,
        ])
            ->assertCreated()
            ->assertJsonPath('success', true);
    }
}

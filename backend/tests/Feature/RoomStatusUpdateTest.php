<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\RoomStatusLog;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * The room-status transition endpoint is what the housekeeping page drives
 * every state change through. Three contracts to lock down:
 *   1. The endpoint is staff-only (a public route would let any guest move
 *      rooms in and out of "available" and break the booking flow).
 *   2. Valid status values match the canonical enum we expose to the
 *      frontend; an invalid value must 422, not silently fall back.
 *   3. Every successful transition writes a RoomStatusLog row capturing the
 *      old and new status — this is the audit trail used by the room-status
 *      history page and any future reporting.
 */
class RoomStatusUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function makeStaff(string $role = 'housekeeper'): User
    {
        return User::create([
            'name'     => $role,
            'email'    => $role . '-' . uniqid() . '@example.test',
            'password' => Hash::make('secret'),
            'role'     => $role,
        ]);
    }

    private function makeRoom(string $status = 'available'): Room
    {
        $type = RoomType::create([
            'name' => 'Std',
            'slug' => 's-' . uniqid(),
            'base_price' => 10000,
            'max_occupancy' => 2,
        ]);

        return Room::create([
            'room_number' => (string) random_int(100, 999),
            'room_type_id' => $type->id,
            'floor' => 1,
            'status' => $status,
            'is_active' => true,
        ]);
    }

    public function test_update_status_requires_authentication(): void
    {
        $room = $this->makeRoom();

        $this->postJson("/api/rooms/{$room->id}/status", ['status' => 'dirty'])
            ->assertStatus(401);
    }

    public function test_update_status_rejects_invalid_value(): void
    {
        $user = $this->makeStaff();
        $room = $this->makeRoom();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/rooms/{$room->id}/status", ['status' => 'invented'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_update_status_transitions_room_and_writes_log(): void
    {
        $user = $this->makeStaff('housekeeper');
        $room = $this->makeRoom('dirty');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/rooms/{$room->id}/status", [
                'status' => 'cleaning',
                'notes'  => 'Started at 10:15',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cleaning');

        $this->assertDatabaseHas('rooms', ['id' => $room->id, 'status' => 'cleaning']);
        $this->assertDatabaseHas('room_status_logs', [
            'room_id'    => $room->id,
            'old_status' => 'dirty',
            'new_status' => 'cleaning',
            'changed_by' => $user->id,
        ]);
    }

    public function test_update_status_no_op_does_not_write_log(): void
    {
        $user = $this->makeStaff();
        $room = $this->makeRoom('clean');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/rooms/{$room->id}/status", ['status' => 'clean'])
            ->assertOk()
            ->assertJsonPath('data.status', 'clean');

        $this->assertDatabaseCount('room_status_logs', 0);
    }

    public function test_status_summary_returns_counts_for_every_state(): void
    {
        $user = $this->makeStaff('manager');
        $this->makeRoom('available');
        $this->makeRoom('available');
        $this->makeRoom('dirty');

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/rooms/status-summary')
            ->assertOk()
            ->json();

        $summary = $res['data']['summary'];
        $this->assertSame(2, $summary['available']);
        $this->assertSame(1, $summary['dirty']);
        $this->assertSame(0, $summary['cleaning']);
        $this->assertSame(0, $summary['clean']);
        $this->assertSame(0, $summary['inspected']);
        $this->assertSame(3, $res['data']['total_rooms']);
    }

    public function test_update_status_accepts_all_canonical_states(): void
    {
        $states = [
            'available', 'occupied', 'dirty', 'cleaning', 'clean',
            'inspected', 'reserved', 'maintenance', 'out_of_service',
        ];

        foreach ($states as $i => $target) {
            $user = $this->makeStaff();
            $room = $this->makeRoom('available');

            $this->actingAs($user, 'sanctum')
                ->postJson("/api/rooms/{$room->id}/status", ['status' => $target])
                ->assertOk()
                ->assertJsonPath('data.status', $target);

            $this->assertSame($target, $room->fresh()->status);
        }
    }
}

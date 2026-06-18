<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use App\Models\Booking;

class RoomController extends Controller
{
    public function index()
    {
        return $this->success('Rooms retrieved successfully', Room::with('roomType')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_type_id' => 'required|exists:room_types,id',
            'room_number' => 'required|unique:rooms',
            'floor' => 'required|integer|min:0',
            'status' => 'required|in:available,occupied,dirty,cleaning,clean,inspected,reserved,maintenance,out_of_service',
            'is_active' => 'required|boolean'
        ]);

        $room = Room::create($validated);

        return $this->success('Room created successfully', $room->load('roomType'), 201);
    }

    public function show(Room $room)
    {
        return $this->success('Room retrieved successfully', $room->load('roomType'));
    }

    public function update(Request $request, Room $room)
    {
        $validated = $request->validate([
            'room_type_id' => 'sometimes|required|exists:room_types,id',
            'room_number' => 'sometimes|required|unique:rooms,room_number,' . $room->id,
            'floor' => 'sometimes|required|integer|min:0',
            'status' => 'sometimes|required|in:available,occupied,dirty,cleaning,clean,inspected,reserved,maintenance,out_of_service',
            'is_active' => 'sometimes|required|boolean'
        ]);

        $room->update($validated);

        return $this->success('Room updated successfully', $room->load('roomType'));
    }

    public function updateStatus(Request $request, Room $room)
    {
        $validated = $request->validate([
            'status' => 'required|in:available,occupied,dirty,cleaning,clean,inspected,reserved,maintenance,out_of_service',
            'notes'  => 'nullable|string|max:1000',
        ]);

        $oldStatus = $room->status;

        if ($oldStatus === $validated['status']) {
            return $this->success('Room status unchanged', $room->load('roomType'));
        }

        $room->status = $validated['status'];
        $room->save();

        \App\Models\RoomStatusLog::create([
            'room_id'     => $room->id,
            'old_status'  => $oldStatus,
            'new_status'  => $validated['status'],
            'changed_by'  => $request->user()?->id,
            'changed_at'  => now(),
        ]);

        return $this->success('Room status updated successfully', $room->load('roomType'));
    }

    public function statusSummary()
    {
        $counts = Room::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $states = [
            'available', 'occupied', 'dirty', 'cleaning',
            'clean', 'inspected', 'reserved', 'maintenance', 'out_of_service',
        ];

        $summary = [];
        foreach ($states as $state) {
            $summary[$state] = (int) ($counts[$state] ?? 0);
        }

        return $this->success('Room status summary retrieved successfully', [
            'summary' => $summary,
            'total_rooms' => (int) array_sum($summary),
        ]);
    }

    public function destroy(Room $room)
    {
        $room->delete();

        return $this->success('Room deleted successfully');
    }

    public function availableRooms(Request $request)
    {
        $request->validate([
            'check_in_date' => 'required|date',
            'check_out_date' => 'required|date|after:check_in_date'
        ]);

        $bookedRoomIds = Booking::where('status', '!=', 'cancelled')
            ->where('check_in_date', '<', $request->check_out_date)
            ->where('check_out_date', '>', $request->check_in_date)
            ->pluck('room_id');

        $rooms = Room::with('roomType')
            ->whereNotIn('id', $bookedRoomIds)
            ->where('status', 'available')
            ->where('is_active', true)
            ->get();

        return $this->success('Available rooms retrieved successfully', $rooms);
    }
}

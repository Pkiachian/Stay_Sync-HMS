<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HousekeepingTask;
use Illuminate\Http\Request;

class HousekeepingTaskController extends Controller
{
    public function index()
    {
        return $this->success('Housekeeping tasks retrieved successfully', HousekeepingTask::with('room', 'assignedStaff')->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'assigned_to' => 'nullable|exists:users,id',
            'task_type' => 'required|string',
            'priority' => 'nullable|in:low,normal,urgent',
            'status' => 'required|in:pending,in_progress,completed',
            'notes' => 'nullable|string'
        ]);

        $task = HousekeepingTask::create($validated);

        return $this->success('Housekeeping task created successfully', $task->load('room', 'assignedStaff'), 201);
    }

    public function show($id)
    {
        return $this->success('Housekeeping task retrieved successfully', HousekeepingTask::with('room', 'assignedStaff')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $task = HousekeepingTask::findOrFail($id);

        $validated = $request->validate([
            'room_id' => 'sometimes|required|exists:rooms,id',
            'assigned_to' => 'nullable|exists:users,id',
            'task_type' => 'sometimes|required|string',
            'priority' => 'sometimes|required|in:low,normal,urgent',
            'status' => 'sometimes|required|in:pending,in_progress,completed',
            'notes' => 'nullable|string',
        ]);

        if (($validated['status'] ?? null) === 'completed' && !$task->completed_at) {
            $validated['completed_at'] = now();
        }

        $task->update($validated);

        return $this->success('Housekeeping task updated successfully', $task->load('room', 'assignedStaff'));
    }

    public function destroy($id)
    {
        $task = HousekeepingTask::findOrFail($id);
        $task->delete();

        return $this->success('Housekeeping task deleted successfully');
    }
}

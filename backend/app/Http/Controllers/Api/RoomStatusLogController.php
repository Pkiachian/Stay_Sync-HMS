<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomStatusLog;
use Illuminate\Http\Request;

class RoomStatusLogController extends Controller
{
    public function index(Request $request)
    {
        $query = RoomStatusLog::with(['room', 'changedBy'])->latest('changed_at');

        if ($roomId = $request->query('room_id')) {
            $query->where('room_id', $roomId);
        }

        if ($newStatus = $request->query('new_status')) {
            $query->where('new_status', $newStatus);
        }

        $logs = $query->limit(100)->get();

        $summary = [
            'available'     => Room::where('status', 'available')->count(),
            'occupied'      => Room::where('status', 'occupied')->count(),
            'dirty'         => Room::where('status', 'dirty')->count(),
            'cleaning'      => Room::where('status', 'cleaning')->count(),
            'clean'         => Room::where('status', 'clean')->count(),
            'inspected'     => Room::where('status', 'inspected')->count(),
            'reserved'      => Room::where('status', 'reserved')->count(),
            'maintenance'   => Room::where('status', 'maintenance')->count(),
            'out_of_service'=> Room::where('status', 'out_of_service')->count(),
        ];

        return $this->success('Room status log retrieved successfully', [
            'logs'    => $logs,
            'summary' => $summary,
        ]);
    }
}

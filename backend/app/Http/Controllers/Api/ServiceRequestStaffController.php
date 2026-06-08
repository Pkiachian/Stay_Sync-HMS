<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;

class ServiceRequestStaffController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceRequest::query()->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->query('service_type')) {
            $query->where('service_type', $type);
        }

        if ($source = $request->query('source')) {
            $query->where('source', $source);
        }

        return $this->success('Service requests retrieved successfully', $query->with('resolver')->get());
    }

    public function update(Request $request, string $id)
    {
        $serviceRequest = ServiceRequest::findOrFail($id);

        $data = $request->validate([
            'status'      => 'sometimes|required|in:' . implode(',', ServiceRequest::STATUSES),
            'staff_notes' => 'nullable|string|max:2000',
        ]);

        $payload = $data;

        if (($data['status'] ?? null) === 'resolved' && !$serviceRequest->resolved_at) {
            $payload['resolved_at'] = now();
            $payload['resolved_by'] = $request->user()?->id;
        }

        $serviceRequest->update($payload);

        return $this->success('Service request updated successfully', $serviceRequest->fresh('resolver'));
    }
}

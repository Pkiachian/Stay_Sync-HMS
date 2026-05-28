<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoomType;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomTypeController extends Controller
{
    public function index()
    {
        return $this->success('Room types retrieved successfully', RoomType::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:room_types,slug',
            'base_price' => 'required|numeric|min:0',
            'max_occupancy' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'amenities' => 'nullable|array',
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        if (RoomType::where('slug', $validated['slug'])->exists()) {
            return $this->error('Validation failed', [
                'slug' => ['The slug has already been taken.'],
            ], 422);
        }

        $roomType = RoomType::create($validated);

        return $this->success('Room type created successfully', $roomType, 201);
    }

    public function show(string $id)
    {
        $roomType = RoomType::with('rooms')->findOrFail($id);

        return $this->success('Room type retrieved successfully', $roomType);
    }

    public function update(Request $request, string $id)
    {
        $roomType = RoomType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:room_types,slug,' . $roomType->id,
            'base_price' => 'sometimes|required|numeric|min:0',
            'max_occupancy' => 'sometimes|required|integer|min:1',
            'description' => 'nullable|string',
            'amenities' => 'nullable|array',
        ]);

        if (array_key_exists('name', $validated) && !array_key_exists('slug', $validated)) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        if (array_key_exists('slug', $validated) && RoomType::where('slug', $validated['slug'])->where('id', '!=', $roomType->id)->exists()) {
            return $this->error('Validation failed', [
                'slug' => ['The slug has already been taken.'],
            ], 422);
        }

        $roomType->update($validated);

        return $this->success('Room type updated successfully', $roomType);
    }

    public function destroy(string $id)
    {
        $roomType = RoomType::findOrFail($id);
        $roomType->delete();

        return $this->success('Room type deleted successfully');
    }
}

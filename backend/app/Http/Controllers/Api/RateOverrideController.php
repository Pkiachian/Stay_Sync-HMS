<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RateOverride;

class RateOverrideController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL RATE OVERRIDES
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        return $this->success('Rate overrides retrieved successfully', RateOverride::with('roomType')->latest()->get());
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE RATE OVERRIDE
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([

            'room_type_id' => 'required|exists:room_types,id',

            'start_date' => 'required|date',

            'end_date' => 'required|date|after_or_equal:start_date',

            'price' => 'required|numeric|min:0',
        ]);

        $override = RateOverride::create($validated);

        return $this->success('Rate override created successfully', $override->load('roomType'), 201);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW SINGLE RATE OVERRIDE
    |--------------------------------------------------------------------------
    */

    public function show(string $id)
    {
        $override = RateOverride::with('roomType')->findOrFail($id);

        return $this->success('Rate override retrieved successfully', $override);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE RATE OVERRIDE
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, string $id)
    {
        $override = RateOverride::findOrFail($id);

        $validated = $request->validate([

            'room_type_id' => 'sometimes|exists:room_types,id',

            'start_date' => 'sometimes|date',

            'end_date' => 'sometimes|date|after_or_equal:start_date',

            'price' => 'sometimes|numeric|min:0',
        ]);

        $override->update($validated);

        return $this->success('Rate override updated successfully', $override->load('roomType'));
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE RATE OVERRIDE
    |--------------------------------------------------------------------------
    */

    public function destroy(string $id)
    {
        $override = RateOverride::findOrFail($id);

        $override->delete();

        return $this->success('Rate override deleted successfully');
    }
}

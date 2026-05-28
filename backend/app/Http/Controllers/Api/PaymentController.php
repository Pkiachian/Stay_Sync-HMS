<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        return $this->success('Payments retrieved successfully', Payment::with('booking')->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|in:cash,mpesa,card,bank',
            'payment_date' => 'required|date',
            'reference_number' => 'nullable|string',
            'status' => 'nullable|in:pending,completed,failed,refunded',
        ]);

        $payment = Payment::create([
            'booking_id' => $validated['booking_id'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'transaction_reference' => $validated['reference_number'] ?? null,
            'status' => $validated['status'] ?? 'completed',
            'paid_at' => $validated['payment_date'],
        ]);

        return $this->success('Payment created successfully', $payment->load('booking'), 201);
    }

    public function show($id)
    {
        return $this->success('Payment retrieved successfully', Payment::with('booking')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $payment = Payment::findOrFail($id);

        $validated = $request->validate([
            'booking_id' => 'sometimes|required|exists:bookings,id',
            'amount' => 'sometimes|required|numeric|min:1',
            'payment_method' => 'sometimes|required|in:cash,mpesa,card,bank',
            'payment_date' => 'sometimes|required|date',
            'reference_number' => 'nullable|string',
            'status' => 'sometimes|required|in:pending,completed,failed,refunded',
        ]);

        $payload = [];

        foreach (['booking_id', 'amount', 'payment_method', 'status'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $validated[$field];
            }
        }

        if (array_key_exists('reference_number', $validated)) {
            $payload['transaction_reference'] = $validated['reference_number'];
        }

        if (array_key_exists('payment_date', $validated)) {
            $payload['paid_at'] = $validated['payment_date'];
        }

        $payment->update($payload);

        return $this->success('Payment updated successfully', $payment->load('booking'));
    }

    public function destroy($id)
    {
        $payment = Payment::findOrFail($id);
        $payment->delete();

        return $this->success('Payment deleted successfully');
    }
}

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $booking->booking_reference }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111827; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
        .muted { color: #6b7280; }
        .total { font-weight: bold; }
    </style>
</head>
<body>
    <h1>Invoice</h1>
    <div class="muted">Reference: {{ $booking->booking_reference }}</div>

    <table>
        <tr>
            <th>Guest</th>
            <td>{{ $booking->guest->first_name }} {{ $booking->guest->last_name }}</td>
        </tr>
        <tr>
            <th>Room</th>
            <td>{{ $booking->room->room_number }}</td>
        </tr>
        <tr>
            <th>Stay</th>
            <td>{{ $booking->check_in_date }} to {{ $booking->check_out_date }}</td>
        </tr>
        <tr>
            <th>Subtotal</th>
            <td>{{ number_format($booking->subtotal, 2) }}</td>
        </tr>
        <tr>
            <th>Tax</th>
            <td>{{ number_format($booking->tax_amount, 2) }}</td>
        </tr>
        <tr>
            <th>Total</th>
            <td class="total">{{ number_format($booking->total_price, 2) }}</td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>Payment Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($booking->payments as $payment)
                <tr>
                    <td>{{ optional($payment->paid_at)->format('Y-m-d') }}</td>
                    <td>{{ $payment->payment_method }}</td>
                    <td>{{ $payment->transaction_reference }}</td>
                    <td>{{ number_format($payment->amount, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">No payments recorded.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>

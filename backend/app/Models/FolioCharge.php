<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FolioCharge extends Model
{
    protected $fillable = [
        'booking_id',
        'charge_type',
        'description',
        'amount',
        'posted_by',
        'charged_at'
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'booking_reference',
        'guest_id',
        'room_id',
        'room_type_id',
        'check_in_date',
        'check_out_date',
        'actual_check_in',
        'actual_check_out',
        'num_adults',
        'num_children',
        'status',
        'source',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_price',
        'special_requests'
    ];

    public function guest()
    {
        return $this->belongsTo(Guest::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function folioCharges()
    {
        return $this->hasMany(FolioCharge::class);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guest extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'gender',
        'nationality',
        'id_type',
        'id_number',
        'address',
        'city',
        'country',
        'notes',
        'loyalty_tier',
        'total_stays'
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}

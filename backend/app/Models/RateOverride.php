<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RateOverride extends Model
{
    protected $fillable = [
        'room_type_id',
        'start_date',
        'end_date',
        'price'
    ];

    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }
}
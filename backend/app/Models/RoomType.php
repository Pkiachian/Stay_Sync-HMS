<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'base_price',
        'max_occupancy',
        'description',
        'amenities'
    ];

    protected $casts = [
        'amenities' => 'array'
    ];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}

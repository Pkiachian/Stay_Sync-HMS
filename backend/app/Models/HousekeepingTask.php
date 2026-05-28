<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HousekeepingTask extends Model
{
    protected $fillable = [
        'room_id',
        'assigned_to',
        'task_type',
        'priority',
        'status',
        'notes',
        'completed_at'
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function room()
{
    return $this->belongsTo(Room::class);
}

public function assignedStaff()
{
    return $this->belongsTo(User::class, 'assigned_to');
}
}

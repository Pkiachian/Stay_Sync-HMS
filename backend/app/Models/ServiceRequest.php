<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    public const SERVICE_TYPES = ['taxi', 'airport', 'wakeup', 'laundry', 'housekeeping', 'tour', 'chat_handoff'];
    public const STATUSES = ['open', 'in_progress', 'resolved', 'cancelled'];

    protected $fillable = [
        'reference',
        'service_type',
        'source',
        'guest_name',
        'room_number',
        'phone',
        'email',
        'preferred_at',
        'details',
        'transcript',
        'status',
        'staff_notes',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'preferred_at' => 'datetime',
        'resolved_at'  => 'datetime',
        'transcript'   => 'array',
    ];

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}

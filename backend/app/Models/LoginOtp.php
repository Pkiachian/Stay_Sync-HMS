<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginOtp extends Model
{
    public const MAX_ATTEMPTS = 5;
    public const TTL_MINUTES  = 10;

    protected $fillable = [
        'user_id',
        'otp_token',
        'code_hash',
        'attempts',
        'expires_at',
        'consumed_at',
        'ip',
        'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at?->isPast() ?? true;
    }

    public function isExhausted(): bool
    {
        return $this->attempts >= self::MAX_ATTEMPTS;
    }

    public function isConsumed(): bool
    {
        return $this->consumed_at !== null;
    }
}

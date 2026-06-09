<?php

namespace App\Exceptions;

use RuntimeException;

class OtpInvalidException extends RuntimeException
{
    public const REASON_NOT_FOUND = 'not_found';
    public const REASON_EXPIRED   = 'expired';
    public const REASON_EXHAUSTED = 'exhausted';
    public const REASON_CONSUMED  = 'consumed';
    public const REASON_BAD_CODE  = 'bad_code';

    public function __construct(
        public readonly string $reason,
        public readonly int $remainingAttempts = 0,
        string $message = ''
    ) {
        parent::__construct($message !== '' ? $message : $reason);
    }
}

<?php

namespace App\Services;

use App\Models\RoomType;

/**
 * Tool registry for the chat agent. Each tool is an OpenAI function-calling
 * schema + a local executor that returns a JSON-serializable result.
 *
 * Tools are intentionally read-only and return tiny, LLM-friendly payloads.
 * Anything sensitive (bookings, loyalty, payment) is NOT exposed here.
 */
class ChatToolRegistry
{
    /**
     * Return the JSON-schemas of all tools for the OpenAI `tools` payload.
     *
     * @return array<int, array{type: string, function: array{name: string, description: string, parameters: array}}>
     */
    public static function schemas(): array
    {
        return [
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'list_room_types',
                    'description' => 'List the room types the hotel offers, including name, base price, max occupancy, and amenities. Use this when the guest asks about rooms, prices, or what the hotel offers. No personal data is returned.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => (object) [
                            'category' => [
                                'type'        => 'string',
                                'description' => 'Optional filter. Not currently used — kept for forward compatibility.',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'request_human_handoff',
                    'description' => 'Trigger a handoff to the human concierge team. Call this when the guest asks to speak to a person, when you cannot help with their request, or when the request requires human action (refunds, complaints, special requests, room changes, complex bookings). The system will create a service request and staff will follow up.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => (object) [
                            'reason' => [
                                'type'        => 'string',
                                'description' => 'Short explanation of why a human is needed. Will be shown to staff.',
                            ],
                        ],
                        'required' => ['reason'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Dispatch a tool call by name. Returns a string the LLM will see in the
     * next turn. The controller checks the SPECIAL marker to detect handoffs.
     */
    public static function call(string $name, array $arguments = []): string
    {
        return match ($name) {
            'list_room_types'        => self::listRoomTypes(),
            'request_human_handoff'  => self::requestHumanHandoff($arguments),
            default                  => json_encode(['error' => "Unknown tool '{$name}'"]),
        };
    }

    private static function listRoomTypes(): string
    {
        $rows = RoomType::query()
            ->orderBy('base_price')
            ->get(['id', 'name', 'base_price', 'max_occupancy', 'description', 'amenities'])
            ->map(fn ($r) => [
                'id'             => $r->id,
                'name'           => $r->name,
                'base_price_kes' => (float) $r->base_price,
                'max_occupancy'  => (int) $r->max_occupancy,
                'description'    => $r->description,
                'amenities'      => $r->amenities ?? [],
            ])
            ->all();

        return json_encode([
            'currency'   => 'KES',
            'as_of'      => now()->toIso8601String(),
            'room_types' => $rows,
            'note'       => 'These are the published base rates per night. Real-time availability and total prices require a date range and can be checked at /portal/booking.',
        ], JSON_UNESCAPED_UNICODE);
    }

    private static function requestHumanHandoff(array $arguments): string
    {
        $reason = trim((string) ($arguments['reason'] ?? 'Guest requested a human'));
        return json_encode([
            '__handoff__' => true,
            'reason'      => $reason,
            'message'     => 'Handoff recorded. Staff will follow up shortly.',
        ], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Helper for the controller: detect the special handoff marker in a tool result.
     */
    public static function isHandoffMarker(string $toolResult): bool
    {
        $decoded = json_decode($toolResult, true);
        return is_array($decoded) && !empty($decoded['__handoff__']);
    }

    public static function handoffReason(string $toolResult): string
    {
        $decoded = json_decode($toolResult, true);
        return (string) ($decoded['reason'] ?? 'Guest requested a human');
    }
}

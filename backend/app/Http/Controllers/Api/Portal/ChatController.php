<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use App\Services\ChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function __construct(private ChatService $chat) {}

    /**
     * POST /api/portal/chat
     *
     * Body: {
     *   messages:    [{role: 'user'|'assistant'|'system', content: string}, ...],
     *   session_id?: string,         // opaque client-side id; echoed back so the client can correlate
     *   guest_name?: string,         // optional, used to create a handoff service request
     *   room_number?: string,
     * }
     *
     * Public, no auth. Returns:
     *   { success, data: { reply, handoff: null | { reason, reference, id } } }
     */
    public function ask(Request $request)
    {
        $data = $request->validate([
            'messages'                => 'required|array|min:1|max:30',
            'messages.*.role'         => 'required|in:user,assistant,system',
            'messages.*.content'      => 'required|string|max:2000',
            'session_id'              => 'nullable|string|max:64',
            'guest_name'              => 'nullable|string|max:120',
            'room_number'             => 'nullable|string|max:20',
        ]);

        $result = $this->getReply($data['messages']);

        $handoff = null;
        if (!empty($result['handoff'])) {
            $handoff = $this->createHandoff($result['handoff']['reason'] ?? 'Guest requested a human', $data, $data['messages']);
        }

        return $this->success('Reply generated', [
            'reply'   => $result['reply'],
            'handoff' => $handoff,
        ]);
    }

    /**
     * Cache the assistant's reply so repeat/similar questions are served
     * from cache for 1 hour. Keyed on the system prompt + the last two
     * user turns, so a follow-up like "and for a deluxe room?" stays
     * distinct from the standalone question.
     *
     * Handoff results are not cached: each handoff is a one-off decision
     * and the next turn deserves a fresh model call.
     */
    private function getReply(array $messages): array
    {
        $cacheKey = $this->cacheKey($messages);

        return Cache::remember($cacheKey, now()->addHour(), function () use ($messages) {
            return $this->chat->reply($messages);
        });
    }

    private function cacheKey(array $messages): string
    {
        $userTurns = array_values(array_filter(
            $messages,
            fn ($m) => ($m['role'] ?? null) === 'user',
        ));
        $recent = array_slice($userTurns, -2);
        $tail = array_map(fn ($m) => (string) ($m['content'] ?? ''), $recent);

        return 'chat:reply:' . md5(implode("\n--\n", $tail));
    }

    private function createHandoff(string $reason, array $meta, array $messages): array
    {
        $reference = 'SR-' . strtoupper(uniqid());

        $guestName = $meta['guest_name'] ?? 'Guest (chat)';
        $roomNumber = $meta['room_number'] ?? null;

        $details = "Reason: {$reason}\n\nTriggered by chat session " . ($meta['session_id'] ?? 'n/a');

        // Trim transcript to the last 12 messages to keep the row lean.
        $transcript = array_slice($messages, -12);
        $transcript = array_map(fn ($m) => [
            'role'    => $m['role'] ?? 'user',
            'content' => (string) ($m['content'] ?? ''),
        ], $transcript);

        $row = ServiceRequest::create([
            'reference'   => $reference,
            'service_type' => 'chat_handoff',
            'source'      => 'chat',
            'guest_name'  => $guestName,
            'room_number' => $roomNumber,
            'details'     => $details,
            'transcript'  => $transcript,
            'status'      => 'open',
        ]);

        return [
            'reason'    => $reason,
            'reference' => $reference,
            'id'        => $row->id,
        ];
    }
}

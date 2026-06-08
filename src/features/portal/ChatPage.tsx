import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Headphones, Loader2, RefreshCw, Send, User } from 'lucide-react';
import { askPortalChat, type PortalChatHandoff } from '@/lib/portalApi';

type Msg = { from: 'user' | 'bot'; text: string };
type ApiMsg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'What time is breakfast?',
  'Wi-Fi password please',
  'Can I check in online?',
  'How much is a deluxe room?',
];

const FALLBACK_REPLY =
  "I'm not sure I understood that. For help with towels, check-in, checkout, Wi-Fi, breakfast, taxi, laundry, wake-up calls, tours, and pool/gym/spa hours, please use the concierge form.";

const SESSION_KEY = 'staysync.chat.session_id';

function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh =
      'chat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return 'chat-' + Date.now().toString(36);
  }
}

export default function PortalChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'bot', text: "Hi! I'm the StaySync help desk. Ask me about your stay — check-in, Wi-Fi, breakfast, taxis, and more. For anything I can't help with, the concierge team is one click away." },
  ]);
  const [history, setHistory] = useState<ApiMsg[]>([]);
  const [input, setInput]     = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError]     = useState('');
  const [handoff, setHandoff] = useState<PortalChatHandoff | null>(null);
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending, handoff]);

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || pending) return;
    setInput('');
    setError('');
    setMessages((m) => [...m, { from: 'user', text: value }]);
    setPending(true);

    const nextHistory: ApiMsg[] = [...history, { role: 'user', content: value }];
    try {
      const res = await askPortalChat({
        messages: nextHistory,
        session_id: sessionId,
      });
      const payload = res.data.data;
      const reply = payload.reply?.trim() || FALLBACK_REPLY;
      setMessages((m) => [...m, { from: 'bot', text: reply }]);
      setHistory([...nextHistory, { role: 'assistant', content: reply }]);
      if (payload.handoff) {
        setHandoff(payload.handoff);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'The help desk is unavailable. Please try again or use the concierge form.');
      setMessages((m) => [...m, { from: 'bot', text: FALLBACK_REPLY }]);
    } finally {
      setPending(false);
    }
  }

  function resetSession() {
    setMessages([
      { from: 'bot', text: "Hi! I'm the StaySync help desk. Ask me about your stay — check-in, Wi-Fi, breakfast, taxis, and more. For anything I can't help with, the concierge team is one click away." },
    ]);
    setHistory([]);
    setInput('');
    setError('');
    setHandoff(null);
    try {
      const fresh =
        'chat-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem(SESSION_KEY, fresh);
    } catch {
      // ignore storage failures
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Quick answers</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Guest Help Chat</h1>
        <p className="mt-1 text-sm text-cyan-50/70">Common questions about your stay, services, and the hotel. For complex requests, use the concierge form.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/14 bg-white/95 text-slate-900 shadow-xl">
        <div className="h-[420px] space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.from === 'bot' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.text}
              </div>
              {m.from === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {pending && (
            <div className="flex gap-2 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          {handoff && (
            <div className="flex gap-2 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <Headphones className="h-4 w-4" />
              </div>
              <div className="max-w-[80%] space-y-1 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
                <p className="font-semibold">Connected to the concierge team</p>
                <p className="text-xs text-violet-800/80">
                  Reference: <span className="font-mono">{handoff.reference}</span>
                </p>
                <p className="text-xs text-violet-800/80">
                  Reason: {handoff.reason}
                </p>
                <p className="pt-1 text-[11px] text-violet-700/70">
                  A staff member will follow up shortly.
                </p>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 p-3">
          {error && (
            <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>
          )}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                disabled={pending}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
            <button
              onClick={resetSession}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 disabled:opacity-50"
              title="Start a new conversation"
            >
              <RefreshCw className="h-3 w-3" />
              New chat
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={pending}
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void send('I would like to speak to a human, please.')}
              disabled={pending}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
              title="Ask to be connected to a human"
            >
              <Headphones className="h-3.5 w-3.5" />
              Human
            </button>
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

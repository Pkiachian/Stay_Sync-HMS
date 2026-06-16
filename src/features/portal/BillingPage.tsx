import { useEffect, useState } from 'react';
import { CreditCard, FileText, Hash, Loader2, Phone, Printer, Receipt, User, X } from 'lucide-react';
import {
  buildPortalInvoiceUrl,
  fetchPortalInvoices,
  lookupPortalBooking,
  payPortalDeposit,
  type MpesaStkResponse,
  type PortalInvoiceLine,
  type PortalInvoicesResponse,
  type PortalLookupResponse,
} from '@/lib/portalApi';

type PayState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; data: MpesaStkResponse }
  | { status: 'error'; message: string };

type IdentifyState =
  | { status: 'idle' }
  | { status: 'verifying' }
  | { status: 'error'; message: string };

type PortalSession = {
  bookingId: number;
  reference: string;
  lastName: string;
  listToken: string;
};

const SESSION_KEY = 'staysync_portal_billing_session';

function loadSession(): PortalSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalSession;
    if (!parsed.bookingId || !parsed.listToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(s: PortalSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export default function PortalBillingPage() {
  const [session, setSession] = useState<PortalSession | null>(() => loadSession());
  const [identify, setIdentify] = useState<IdentifyState>({ status: 'idle' });
  const [ref, setRef] = useState('');
  const [lastName, setLastName] = useState('');

  const [invoices, setInvoices] = useState<PortalInvoicesResponse | null>(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [pay, setPay] = useState<PayState>({ status: 'idle' });
  const [phone, setPhone] = useState('+254');
  const [payingLine, setPayingLine] = useState<PortalInvoiceLine | null>(null);
  const [payMode, setPayMode] = useState<'deposit' | 'full' | 'custom'>('deposit');
  const [customAmount, setCustomAmount] = useState('');

  const [printingLine, setPrintingLine] = useState<PortalInvoiceLine | null>(null);
  const [printError, setPrintError] = useState('');

  // Whenever we have a session, fetch the (scoped) invoice list. Re-runs
  // when the session changes. The token is in the URL, never a path param.
  useEffect(() => {
    if (!session) {
      setInvoices(null);
      return;
    }
    let cancelled = false;
    setLoadingInvoices(true);
    setInvoicesError(null);
    fetchPortalInvoices(session.bookingId, session.listToken)
      .then((res) => {
        if (cancelled) return;
        setInvoices(res.data.data);
        setLoadingInvoices(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        // 401 on the list means the token expired or the session was
        // tampered with — kick the user back to the gate.
        if (status === 401) {
          clearSession();
          setSession(null);
          setIdentify({ status: 'error', message: 'Your session expired. Please identify again.' });
        } else {
          setInvoicesError(message ?? 'Unable to load invoices right now.');
        }
        setLoadingInvoices(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  async function submitIdentify() {
    if (!ref.trim() || !lastName.trim()) {
      setIdentify({ status: 'error', message: 'Enter your booking reference and last name.' });
      return;
    }
    setIdentify({ status: 'verifying' });
    try {
      const res = await lookupPortalBooking({ reference: ref.trim(), lastName: lastName.trim() });
      const data: PortalLookupResponse = res.data.data;
      const next: PortalSession = {
        bookingId: data.booking.id,
        reference: data.booking.booking_reference,
        lastName: lastName.trim(),
        listToken: data.access_token,
      };
      saveSession(next);
      setSession(next);
      setIdentify({ status: 'idle' });
      setRef('');
      setLastName('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setIdentify({
        status: 'error',
        message:
          message ??
          (status === 404
            ? 'No booking found for that reference and last name.'
            : status === 429
              ? 'Too many attempts. Please wait a few minutes.'
              : 'Unable to verify your booking right now.'),
      });
    }
  }

  function signOut() {
    clearSession();
    setSession(null);
    setInvoices(null);
    setInvoicesError(null);
    setRef('');
    setLastName('');
  }

  function openPay(line: PortalInvoiceLine) {
    setPayingLine(line);
    setPay({ status: 'idle' });
    setPayMode('deposit');
    setCustomAmount('');
  }

  function submitPrint() {
    if (!printingLine || !invoices) return;
    setPrintError('');
    try {
      const url = buildPortalInvoiceUrl(
        invoices.booking.id,
        invoices.pdf_token,
        printingLine.status === 'paid' ? 'receipt' : 'invoice',
      );
      window.open(url, '_blank', 'noreferrer');
      setPrintingLine(null);
    } catch {
      setPrintError('Unable to open the document. Please try again.');
    }
  }

  async function handlePay() {
    if (!payingLine || !phone.trim() || !invoices) return;
    const amount = computePayAmount();
    if (!Number.isFinite(amount) || amount <= 0) {
      setPay({ status: 'error', message: 'Enter a valid amount to pay.' });
      return;
    }
    setPay({ status: 'sending' });
    try {
      const res = await payPortalDeposit({
        phone: phone.trim(),
        amount,
        reference: invoices.booking.booking_reference.slice(0, 12),
        purpose: payMode === 'full' ? 'full' : 'deposit',
      });
      setPay({ status: 'sent', data: res.data.data.stk ?? res.data.data });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPay({ status: 'error', message: msg ?? 'M-Pesa request failed. Please try again.' });
    }
  }

  // Suggest a 30% deposit rounded up to the nearest 100, with a minimum
  // of 1,000 KES (below that, M-Pesa push prompts aren't worth the fees).
  function suggestedDeposit(): number {
    if (!payingLine) return 0;
    const raw = Math.ceil((payingLine.amount * 0.3) / 100) * 100;
    return Math.max(1000, Math.min(raw, payingLine.amount));
  }

  function computePayAmount(): number {
    if (!payingLine) return 0;
    if (payMode === 'deposit') return suggestedDeposit();
    if (payMode === 'full')     return payingLine.amount;
    return Number(customAmount) || 0;
  }

  // ── Render the identify gate when there's no active session ────────────
  if (!session) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Secure access</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Billing & Payments</h1>
          <p className="mt-1 text-sm text-cyan-50/70">
            Enter your booking reference and last name to view your invoices and receipts.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submitIdentify();
          }}
          className="space-y-4 rounded-2xl border border-white/14 bg-white/95 p-6 text-slate-900 shadow-xl"
        >
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Booking reference</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200">
              <Hash className="h-4 w-4 text-cyan-600" />
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="BK-XXXXXX"
                autoComplete="off"
                className="h-10 w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Last name</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200">
              <User className="h-4 w-4 text-cyan-600" />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="As on the booking"
                autoComplete="off"
                className="h-10 w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </label>

          {identify.status === 'error' && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {identify.message}
            </p>
          )}

          <button
            type="submit"
            disabled={identify.status === 'verifying'}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {identify.status === 'verifying' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
              </>
            ) : (
              'View my billing'
            )}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            For your security, this view is private to your booking only.
          </p>
        </form>
      </div>
    );
  }

  // ── Authenticated portal session ───────────────────────────────────────
  const lines = invoices?.lines ?? [];
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const paid = lines.filter((l) => l.status === 'paid').reduce((s, l) => s + l.amount, 0);
  const outstandingLine = lines.find((l) => l.status === 'pending') ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100/70">Transparent billing</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Billing & Payments</h1>
            <p className="mt-1 text-sm text-cyan-50/70">
              Showing invoices for booking <span className="font-semibold">{session.reference}</span>.
            </p>
          </div>
          <button
            onClick={signOut}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10"
          >
            Sign out of billing
          </button>
        </div>
      </header>

      {loadingInvoices ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/95 p-8 text-sm text-slate-600 shadow-xl">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your invoices…
        </div>
      ) : invoicesError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 shadow-xl">
          {invoicesError}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total billed" value={`KES ${total.toLocaleString()}`} />
            <Stat label="Paid" value={`KES ${paid.toLocaleString()}`} />
            <Stat label="Outstanding" value={`KES ${(total - paid).toLocaleString()}`} accent={total - paid > 0} />
          </div>

          {outstandingLine && invoices && (
            <section className="rounded-2xl border border-amber-300/40 bg-amber-50 p-5 text-amber-900 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Outstanding balance</p>
                  <p className="mt-1 text-xl font-bold">
                    {outstandingLine.id} · KES {outstandingLine.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-800">{outstandingLine.description}</p>
                </div>
                <button
                  onClick={() => openPay(outstandingLine)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-500"
                >
                  <CreditCard className="h-4 w-4" /> Pay with M-Pesa
                </button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-white/14 bg-white/95 text-slate-900 shadow-xl">
            <header className="flex items-center gap-2 border-b border-slate-200 p-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              <Receipt className="h-4 w-4" /> Your invoices
            </header>
            {lines.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No invoices on this booking yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {lines.map((line) => (
                  <li key={line.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-semibold">{line.id}</p>
                      <p className="text-xs text-slate-500">{line.date} · {line.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-cyan-700">KES {line.amount.toLocaleString()}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          line.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {line.status}
                      </span>
                      {line.purpose === 'deposit' && (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
                          deposit
                        </span>
                      )}
                      {line.status === 'pending' && (
                        <button
                          onClick={() => openPay(line)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 text-xs font-semibold text-white hover:bg-amber-500"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Pay
                        </button>
                      )}
                      <button
                        onClick={() => setPrintingLine(line)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        <Printer className="h-3.5 w-3.5" /> {line.status === 'paid' ? 'Receipt' : 'Print'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {payingLine && invoices && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setPayingLine(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/14 bg-white p-6 text-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pay with M-Pesa</p>
                <h2 className="mt-1 text-lg font-bold">{payingLine.id}</h2>
                <p className="text-xs text-slate-500">{payingLine.description}</p>
              </div>
              <button onClick={() => setPayingLine(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {pay.status !== 'sent' && payingLine && (
              <>
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Amount due</p>
                  <p className="text-2xl font-bold text-cyan-700">KES {payingLine.amount.toLocaleString()}</p>
                </div>

                <p className="mt-3 text-xs text-slate-600">
                  Can't pay in full right now? Secure your booking with a deposit and settle the rest on
                  arrival. The receptionist will record the balance at check-in.
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2" role="tablist">
                  {([
                    { key: 'deposit', label: 'Deposit',  amount: suggestedDeposit() },
                    { key: 'full',    label: 'Pay full', amount: payingLine.amount },
                    { key: 'custom',  label: 'Custom',   amount: null },
                  ] as const).map((opt) => {
                    const active = payMode === opt.key;
                    return (
                      <button
                        key={opt.key}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setPayMode(opt.key)}
                        className={`rounded-xl border px-2 py-2 text-left transition ${
                          active
                            ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-200'
                            : 'border-slate-200 bg-white hover:border-cyan-300'
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{opt.label}</p>
                        <p className="text-sm font-bold text-cyan-700">
                          {opt.amount !== null ? `KES ${opt.amount.toLocaleString()}` : '—'}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {payMode === 'deposit' && (
                  <p className="mt-2 text-[11px] text-amber-700">
                    Suggested 30% deposit. You'll owe{' '}
                    <span className="font-semibold">
                      KES {(payingLine.amount - suggestedDeposit()).toLocaleString()}
                    </span>{' '}
                    on arrival.
                  </p>
                )}

                {payMode === 'custom' && (
                  <label className="mt-2 block">
                    <span className="text-xs font-medium text-slate-600">Custom amount (KES)</span>
                    <input
                      type="number"
                      min={1}
                      max={payingLine.amount}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                    />
                  </label>
                )}

                <label className="mt-3 block">
                  <span className="text-xs font-medium text-slate-600">M-Pesa phone</span>
                  <div className="mt-1 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200">
                    <Phone className="h-3.5 w-3.5 text-cyan-600" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+2547XX XXX XXX"
                      className="h-9 w-full bg-transparent text-sm focus:outline-none"
                    />
                  </div>
                </label>
                {pay.status === 'error' && (
                  <p className="mt-2 text-xs font-medium text-rose-700">{pay.message}</p>
                )}
                <button
                  onClick={handlePay}
                  disabled={pay.status === 'sending' || !phone.trim() || (payMode === 'custom' && !customAmount)}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
                >
                  {pay.status === 'sending' ? 'Sending prompt…' : (
                    <>
                      <CreditCard className="h-4 w-4" />{' '}
                      {payMode === 'deposit'
                        ? `Pay deposit · KES ${suggestedDeposit().toLocaleString()}`
                        : payMode === 'full'
                          ? `Pay full · KES ${payingLine.amount.toLocaleString()}`
                          : customAmount
                            ? `Pay KES ${Number(customAmount).toLocaleString()}`
                            : 'Enter an amount'}
                    </>
                  )}
                </button>
                <p className="mt-2 text-center text-[11px] text-slate-500">
                  An M-Pesa prompt will appear on the phone number above. Enter your PIN to confirm.
                </p>
              </>
            )}

            {pay.status === 'sent' && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-800">Prompt sent</p>
                <p className="mt-1 text-xs text-emerald-900/80">{pay.data.CustomerMessage}</p>
                <p className="mt-2 text-[11px] text-emerald-900/70">
                  Reference: {pay.data.CheckoutRequestID}.{' '}
                  {payMode === 'deposit'
                    ? 'This is your deposit — the balance is settled on arrival.'
                    : 'This dialog will close automatically.'}
                </p>
                <button
                  onClick={() => setPayingLine(null)}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {printingLine && invoices && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setPrintingLine(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/14 bg-white p-6 text-slate-900 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Print document</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                  {printingLine.status === 'paid' ? (
                    <Receipt className="h-4 w-4 text-cyan-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-cyan-600" />
                  )}
                  {printingLine.id}
                </h2>
                <p className="text-xs text-slate-500">{printingLine.description}</p>
              </div>
              <button onClick={() => setPrintingLine(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 rounded-lg bg-cyan-50 px-3 py-2 text-xs text-cyan-900/80">
              We'll fetch the official {printingLine.status === 'paid' ? 'receipt' : 'invoice'} (with StaySync
              signature) and open it as a PDF in a new tab. You can then print or save it from there. The link
              expires in 15 minutes and is tied to this booking.
            </p>

            {printError && <p className="mt-2 text-xs font-medium text-rose-700">{printError}</p>}

            <button
              onClick={submitPrint}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              <Printer className="h-4 w-4" /> Generate & open PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent
          ? 'border-amber-300/40 bg-amber-50 text-amber-800'
          : 'border-white/14 bg-white/95 text-slate-900'
      } shadow-xl`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

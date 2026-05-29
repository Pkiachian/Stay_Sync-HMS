import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const initialForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

type FormState = typeof initialForm;
type FormErrors = Partial<Record<keyof FormState, string>>;

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sentMessage, setSentMessage] = useState('');

  const isComplete = useMemo(() => Object.values(form).every((value) => value.trim().length > 0), [form]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSentMessage('');
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email address is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (form.message.trim().length < 10) nextErrors.message = 'Message should be at least 10 characters.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSentMessage(`Message received. The StaySync team will reply to ${form.email}.`);
    setForm(initialForm);
  };

  const inputClass = (field: keyof FormState) => cn(
    'h-11 rounded-2xl border px-4 text-sm outline-none transition focus:ring-2',
    errors[field] ? 'border-red-300 bg-red-50 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-200',
  );

  return (
    <div className="min-h-screen space-y-5 p-5 lg:p-6">
      <section className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-100/70">Contact Us</p>
        <h2 className="mt-2 text-3xl font-bold">Need help with StaySync?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50/72">Reach the hotel operations desk, request system support, or send feedback about bookings, rooms, guests, and reports.</p>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/14 bg-white/92 p-5 text-slate-950 shadow-xl shadow-slate-950/10 backdrop-blur-xl xl:col-span-2">
          <div className="mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-cyan-700" /><h3 className="font-bold">Send a message</h3></div>

          {sentMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <span>{sentMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className={cn(inputClass('name'), 'w-full')} placeholder="Full name" />
                {errors.name && <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
              </label>
              <label className="space-y-1">
                <input value={form.email} onChange={(event) => updateField('email', event.target.value)} className={cn(inputClass('email'), 'w-full')} placeholder="Email address" />
                {errors.email && <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
              </label>
              <label className="space-y-1 md:col-span-2">
                <input value={form.subject} onChange={(event) => updateField('subject', event.target.value)} className={cn(inputClass('subject'), 'w-full')} placeholder="Subject" />
                {errors.subject && <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" />{errors.subject}</p>}
              </label>
              <label className="space-y-1 md:col-span-2">
                <textarea value={form.message} onChange={(event) => updateField('message', event.target.value)} className={cn('min-h-32 w-full rounded-2xl border p-4 text-sm outline-none transition focus:ring-2', errors.message ? 'border-red-300 bg-red-50 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-200')} placeholder="Write your message..." />
                {errors.message && <p className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" />{errors.message}</p>}
              </label>
            </div>
            <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-cyan-600 px-5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!isComplete}>
              <Send className="h-4 w-4" />Send Message
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {[{ label: 'Phone', value: '0710735860', icon: Phone }, { label: 'Email', value: 'support@staysync.co.ke', icon: Mail }, { label: 'Location', value: 'Nakuru, Kenya', icon: MapPin }, { label: 'Support Hours', value: '24/7 Operations Support', icon: Clock }].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/14 bg-white/92 p-4 text-slate-950 shadow-xl shadow-slate-950/10 backdrop-blur-xl"><Icon className="mb-3 h-5 w-5 text-cyan-700" /><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>
          ))}
        </section>
      </div>
    </div>
  );
}


import { Award, BedDouble, Building2, ShieldCheck, Sparkles, Users } from 'lucide-react';

const values = [
  { title: 'Efficient operations', body: 'StaySync brings bookings, rooms, housekeeping, guests, and reports into one connected workspace.', icon: Sparkles },
  { title: 'Guest-first service', body: 'Reception and management teams can see the right information quickly and respond with confidence.', icon: Users },
  { title: 'Reliable hotel control', body: 'Role-based dashboards help every team focus on the work that matters most to them.', icon: ShieldCheck },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen space-y-5 p-5 lg:p-6">
      <section className="rounded-3xl border border-white/16 bg-slate-950/64 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-2xl">
        <div className="max-w-3xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/14 text-cyan-100 ring-1 ring-cyan-300/20"><Building2 className="h-6 w-6" /></div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-100/70">About Us</p>
          <h2 className="mt-2 text-3xl font-bold">Modern hotel operations for StaySync teams</h2>
          <p className="mt-3 text-sm leading-6 text-cyan-50/72">StaySync is a hotel management system designed to help receptionists, managers, housekeepers, and administrators coordinate daily hotel work from one clean dashboard.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {values.map(({ title, body, icon: Icon }) => (
          <section key={title} className="rounded-2xl border border-white/14 bg-white/92 p-5 text-slate-900 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><Icon className="h-5 w-5" /></div>
            <h3 className="font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-white/14 bg-white/92 p-5 text-slate-900 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Platform Coverage</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[{ label: 'Rooms managed', value: '120', icon: BedDouble }, { label: 'Active team roles', value: '4', icon: Users }, { label: 'Service focus', value: '24/7', icon: Award }].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4"><Icon className="mb-3 h-5 w-5 text-cyan-700" /><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}

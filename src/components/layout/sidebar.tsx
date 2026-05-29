import { NavLink } from 'react-router-dom';
import { BarChart2, BookOpen, Building2, CalendarDays, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Mail, Sparkles, Users } from 'lucide-react';
import { useUIStore } from '@/app/store/uiStore';
import { useAuthStore } from '@/app/store/authStore';
import { cn } from '@/lib/utils';
import { StaySyncLogo } from '@/components/common/StaySyncLogo';

const NAV = [
  { label: 'Dashboard', path: '/', Icon: LayoutDashboard },
  { label: 'Tape Chart', path: '/tape-chart', Icon: CalendarDays },
  { label: 'Bookings', path: '/bookings', Icon: BookOpen },
  { label: 'Housekeeping', path: '/housekeeping', Icon: Sparkles },
  { label: 'Guests', path: '/guests', Icon: Users },
  { label: 'Reports', path: '/reports', Icon: BarChart2 },
  { label: 'About Us', path: '/about', Icon: Building2 },
  { label: 'Contact Us', path: '/contact', Icon: Mail },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <aside className={cn('fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-slate-950/62 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300', sidebarOpen ? 'w-60' : 'w-16')}>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <StaySyncLogo size="sm" showText={sidebarOpen} />
        <button onClick={toggleSidebar} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-cyan-100/70 transition hover:bg-white/10 hover:text-white" aria-label="Toggle sidebar">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV.map(({ label, path, Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => cn('group flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200', isActive ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30' : 'text-cyan-50/70 hover:bg-white/10 hover:text-white')}>
            <Icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className={cn('flex items-center gap-3 rounded-xl bg-white/8 p-2', !sidebarOpen && 'justify-center')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/14 text-sm font-bold text-white">{user.name[0]}</div>
            {sidebarOpen && <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user.name}</p><p className="truncate text-xs capitalize text-cyan-100/60">{user.role}</p></div>}
          </div>
          {sidebarOpen && <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-cyan-100/70 transition hover:bg-red-500/12 hover:text-red-100"><LogOut className="h-3.5 w-3.5" />Sign out</button>}
        </div>
      )}
    </aside>
  );
}


import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, BookOpen,
  Sparkles, Users, BarChart2, ChevronLeft,
  ChevronRight, Hotel,
} from 'lucide-react';
import { useUIStore } from '@/app/store/uiStore';
import { useAuthStore } from '@/app/store/authStore';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard',    path: '/',             Icon: LayoutDashboard },
  { label: 'Tape Chart',   path: '/tape-chart',   Icon: CalendarDays    },
  { label: 'Bookings',     path: '/bookings',     Icon: BookOpen        },
  { label: 'Housekeeping', path: '/housekeeping', Icon: Sparkles        },
  { label: 'Guests',       path: '/guests',       Icon: Users           },
  { label: 'Reports',      path: '/reports',      Icon: BarChart2       },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  return (
    <aside className={cn(
      'fixed top-0 left-0 h-screen bg-card border-r border-border z-40',
      'flex flex-col transition-all duration-300',
      sidebarOpen ? 'w-60' : 'w-16'
    )}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <Hotel className="w-6 h-6 text-primary shrink-0" />
        {sidebarOpen && <span className="font-bold text-lg tracking-tight">StaySync</span>}
        <button onClick={toggleSidebar} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      {sidebarOpen && user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors text-left">
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
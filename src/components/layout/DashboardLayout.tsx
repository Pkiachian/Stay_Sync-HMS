import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import Sidebar from './sidebar';
import { useUIStore } from '@/app/store/uiStore';
import { HotelSlideshow } from '@/components/common/HotelSlideshow';

export default function DashboardLayout() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-foreground">
      <div className="absolute inset-0">
        <HotelSlideshow interval={7000} showLabel={false} overlay={false} />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,19,38,0.42),rgba(9,42,73,0.26),rgba(13,86,114,0.18))]" />
      </div>

      <Sidebar />

      <div
        className="relative z-10 flex min-h-screen flex-col transition-[margin] duration-300 ease-out"
        style={{ marginLeft: sidebarOpen ? 240 : 64 }}
      >
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
          <div className="mx-auto w-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

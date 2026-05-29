import { cn } from '@/lib/utils';

interface StaySyncLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizes = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

export function StaySyncLogo({ size = 'md', showText = true, className, textClassName }: StaySyncLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-800 p-[1px] shadow-lg shadow-cyan-950/30', sizes[size])}>
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-950/18 backdrop-blur-sm">
          <svg viewBox="0 0 64 64" role="img" aria-label="StaySync hotel logo" className="h-full w-full">
            <defs>
              <linearGradient id="staysync-window" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ecfeff" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
            </defs>
            <path d="M12 47h40v7H12z" fill="rgba(255,255,255,.22)" />
            <path d="M18 22 32 11l14 11v28H18V22Z" fill="rgba(255,255,255,.94)" />
            <path d="M23 26h6v6h-6v-6Zm12 0h6v6h-6v-6Zm-12 10h6v6h-6v-6Zm12 0h6v6h-6v-6Z" fill="url(#staysync-window)" />
            <path d="M29 50V39h6v11h-6Z" fill="#0f172a" opacity=".8" />
            <path d="M16 23 32 10l16 13" fill="none" stroke="#cffafe" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M48 16c0 5-4 9-9 9 5 0 9 4 9 9 0-5 4-9 9-9-5 0-9-4-9-9Z" fill="#fde68a" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className={cn('min-w-0 leading-tight', textClassName)}>
          <p className="truncate text-base font-black tracking-tight text-white">StaySync</p>
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-100/62">Hotel Suite</p>
        </div>
      )}
    </div>
  );
}

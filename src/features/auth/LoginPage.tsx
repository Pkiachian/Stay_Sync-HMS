import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { HotelSlideshow } from '@/components/common/HotelSlideshow';
import { Hotel } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuthStore();
  const [email, setEmail]       = useState('admin@staysync.com');
  const [password, setPassword] = useState('password');
  const [error, setError]       = useState('');

 if (isAuthenticated) {
  if (user?.role === 'housekeeping') return <Navigate to="/housekeeping" replace />;
  if (user?.role === 'manager')      return <Navigate to="/reports"      replace />;
  return <Navigate to="/" replace />;
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-3/5 relative">
        <HotelSlideshow interval={4000} showLabel={true} overlay={true} />
        <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight drop-shadow">StaySync</span>
        </div>
        <div className="absolute bottom-12 left-8 right-8 z-20">
          <h2 className="text-white text-3xl font-bold leading-tight drop-shadow-lg">
            Manage your hotel<br />smarter & faster.
          </h2>
          <p className="text-white/70 text-sm mt-2">Real-time front desk operations, all in one place.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
              <Hotel className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">StaySync</h1>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to your dashboard</p>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" htmlFor="email">Email</label>
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" htmlFor="password">Password</label>
                <input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Use your backend user credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

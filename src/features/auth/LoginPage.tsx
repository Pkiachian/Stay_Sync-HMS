import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { HotelSlideshow } from '@/components/common/HotelSlideshow';
import { StaySyncLogo } from '@/components/common/StaySyncLogo';

type Step = 'credentials' | 'otp';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 30;

export default function LoginPage() {
  const {
    login, verifyOtp, resendOtp,
    isAuthenticated, isLoading, user,
  } = useAuthStore();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail]       = useState('admin@staysync.test');
  const [password, setPassword] = useState('password');
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [digits, setDigits]     = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (isAuthenticated) {
    if (user?.role === 'housekeeper') return <Navigate to="/housekeeping" replace />;
    if (user?.role === 'manager')      return <Navigate to="/reports"      replace />;
    return <Navigate to="/" replace />;
  }

  const resetOtp = () => {
    setDigits(Array(OTP_LENGTH).fill(''));
    setOtpToken(null);
    setStep('credentials');
    setError('');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await login(email, password);
      if (result.requiresOtp) {
        setOtpToken(result.otpToken);
        setDigits(Array(OTP_LENGTH).fill(''));
        setStep('otp');
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken || digits.some((d) => d === '')) return;
    setError('');
    try {
      await verifyOtp(otpToken, digits.join(''));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Verification failed. Please try again.';
      setError(message);
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const setDigit = (idx: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleResend = async () => {
    if (!otpToken || resendCooldown > 0) return;
    setError('');
    await resendOtp(otpToken);
    setResendCooldown(RESEND_COOLDOWN_SEC);
    setDigits(Array(OTP_LENGTH).fill(''));
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const canSubmitOtp = digits.every((d) => d !== '');

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-3/5 relative">
        <HotelSlideshow interval={4000} showLabel={true} overlay={true} />
        <div className="absolute top-8 left-8 z-20"><StaySyncLogo size="md" /></div>
        <div className="absolute bottom-12 left-8 right-8 z-20">
          <h2 className="text-white text-3xl font-bold leading-tight drop-shadow-lg">
            Manage your hotel<br />smarter & faster.
          </h2>
          <p className="text-white/70 text-sm mt-2">Real-time front desk operations, all in one place.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-sm">
          <div className="mb-8 flex flex-col items-center lg:hidden"><StaySyncLogo size="lg" textClassName="text-center [&_p:first-child]:text-foreground [&_p:last-child]:text-muted-foreground" /></div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            {step === 'credentials' ? (
              <>
                <h2 className="text-xl font-bold mb-1">Welcome back</h2>
                <p className="text-sm text-muted-foreground mb-6">Sign in to your dashboard</p>
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
                )}
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5" htmlFor="email">Email</label>
                    <input
                      id="email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)} required
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5" htmlFor="password">Password</label>
                    <input
                      id="password" type="password" value={password}
                      onChange={(e) => setPassword(e.target.value)} required
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {isLoading ? 'Sending code…' : 'Sign in'}
                  </button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Demo accounts: admin / manager / receptionist / housekeeper<br />
                  <span className="opacity-70">password: "password" for all</span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">Enter your 6-digit code</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We sent a code to <span className="font-medium text-foreground">{email}</span>.<br />
                  It expires in 10 minutes.
                </p>
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
                )}
                <form onSubmit={handleOtpSubmit}>
                  <div className="flex gap-2 justify-between mb-4" onPaste={handleOtpPaste}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        autoComplete="one-time-code"
                        value={d}
                        onChange={(e) => setDigit(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ))}
                  </div>
                  <button
                    type="submit" disabled={isLoading || !canSubmitOtp}
                    className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {isLoading ? 'Verifying…' : 'Verify and sign in'}
                  </button>
                </form>
                <div className="flex items-center justify-between mt-4 text-xs">
                  <button
                    type="button"
                    onClick={resetOtp}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ← Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get it? Resend"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

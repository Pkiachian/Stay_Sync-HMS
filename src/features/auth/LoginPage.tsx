import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { HotelSlideshow } from '@/components/common/HotelSlideshow';
import { StaySyncLogo } from '@/components/common/StaySyncLogo';

type Step = 'credentials' | 'otp';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 30;

export default function LoginPage() {
  const {
    login, verifyOtp, resendOtp,
    isAuthenticated, isLoading, user, redirectTo,
  } = useAuthStore();

  const navigate = useNavigate();

  // Where to send each role after a successful login. Mirror of
  // backend SessionController::ROLE_HOME — keep them in sync.
  const roleHomeFor = (role: string | undefined): string => {
    switch (role) {
      case 'admin':        return '/';
      case 'manager':      return '/reports';
      case 'receptionist': return '/bookings';
      case 'housekeeper':  return '/housekeeping';
      default:             return '/portal';
    }
  };

  // Surface the real reason for a login failure so users (and us) can
  // distinguish "wrong password" from "server down" from "rate limited".
  const loginErrorMessage = (err: unknown): string => {
    const e = err as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
      code?: string;
    };
    const status = e.response?.status;
    const serverMsg = e.response?.data?.message;
    if (serverMsg) return serverMsg;
    if (status === 401) return 'Wrong email or password.';
    if (status === 422) return 'Email and password are required.';
    if (status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (status === 0 || e.code === 'ERR_NETWORK' || !status) {
      return 'Cannot reach the server. Is the backend running?';
    }
    if (status && status >= 500) return 'The server hit an error. Please try again in a moment.';
    return e.message ?? 'Something went wrong. Please try again.';
  };

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  // If the user is already authenticated when this page first loads (e.g.
  // they hit /login directly while logged in), bounce them to their role's
  // home. We deliberately do NOT trigger this on every render — otherwise
  // a successful verifyOtp() flips isAuthenticated to true, this guard
  // fires, and the user is sent somewhere confusing mid-flow.
  const initialAuth = useRef(isAuthenticated);
  if (initialAuth.current && step === 'credentials') {
    return <Navigate to={roleHomeFor(user?.role)} replace />;
  }

  // After a successful OTP verify, navigate to the role-specific home.
  useEffect(() => {
    if (isAuthenticated && step === 'otp') {
      const dest = redirectTo ?? roleHomeFor(user?.role);
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, step, redirectTo, user?.role, navigate]);

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
    } catch (err: unknown) {
      setError(loginErrorMessage(err));
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@hotel.com" autoComplete="username"
                      required
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5" htmlFor="password">Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" autoComplete="current-password"
                        required
                        className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {isLoading ? 'Sending code…' : 'Sign in'}
                  </button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  A 6-digit verification code will be emailed to you after sign-in.
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

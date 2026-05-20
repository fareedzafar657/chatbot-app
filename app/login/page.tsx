'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { KaiLogo } from '@/app/components/common/KaiLogo';
import { Spinner } from '@/app/components/common/Spinner';
import { PageLoader } from '@/app/components/common/PageLoader';
import { cn } from '@/lib/cn';

// ── Cognito error code → user-friendly message ────────────────────────────────
function cognitoMessage(err: unknown): string {
  const code = (err as { name?: string })?.name;
  switch (code) {
    case 'NotAuthorizedException':      return 'Incorrect email or password.';
    case 'UserNotFoundException':       return 'No account found with this email.';
    case 'UsernameExistsException':     return 'An account with this email already exists.';
    case 'CodeMismatchException':       return 'Invalid confirmation code. Please try again.';
    case 'ExpiredCodeException':        return 'Confirmation code has expired. Please request a new one.';
    case 'UserNotConfirmedException':   return 'Please confirm your email before signing in.';
    case 'InvalidPasswordException':    return 'Password does not meet requirements (min 8 chars, upper, lower, number).';
    case 'LimitExceededException':      return 'Too many attempts. Please wait a moment and try again.';
    default:                            return 'Something went wrong. Please try again.';
  }
}


// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const user      = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login         = useAuthStore((state) => state.login);
  const signup        = useAuthStore((state) => state.signup);
  const confirmSignUp = useAuthStore((state) => state.confirmSignUp);

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [code, setCode]               = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [mode, setMode]               = useState<'signin' | 'signup' | 'confirm'>('signin');

  // Holds the email used during signup — needed for the confirm step
  const pendingEmail = useRef('');

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (!isLoading && user) router.replace('/new');
  }, [isLoading, user, router]);

  // Don't render the form while session is being restored — prevents flash
  if (isLoading) return <PageLoader />;
  if (user) return null;

  const busy = submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'confirm') {
      if (!code.trim()) { setError('Please enter the confirmation code.'); return; }
      setSubmitting(true);
      try {
        await confirmSignUp(pendingEmail.current, code.trim());
        await login(pendingEmail.current, password);
      } catch (err) {
        setError(cognitoMessage(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signup(email, password);
        pendingEmail.current = email;
        setMode('confirm');
      } else {
        await login(email, password);
        router.replace('/new');
      }
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left panel — decorative ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 flex-col bg-[#09090B] relative overflow-hidden p-10">
        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-violet-600/20 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 mb-auto">
          <KaiLogo size={32} />
          <div>
            <div className="text-white text-[15px] font-semibold">K-AI</div>
            <div className="text-white/60 text-[10px] leading-tight">by Fareed Z.</div>
          </div>
        </div>

        {/* Quote */}
        <div className="relative">
          <blockquote className="text-white/80 text-[15px] mb-4 leading-relaxed">
            &ldquo;Most AI chat apps lock you into their flow. K-AI gives you full control —
            branch any conversation, edit any message, and manage exactly how your agent thinks.
            Your context, your rules.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-[11px] font-semibold">FZ</span>
            </div>
            <div>
              <div className="text-white text-[13px] font-medium">Fareed Z.</div>
              <div className="text-white/50 text-[12px]">Creator of K-AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <KaiLogo size={28} />
            <div>
              <div className="text-gray-900 text-[15px] font-semibold">K-AI</div>
              <div className="text-gray-400 text-[10px] leading-tight">by Fareed Z.</div>
            </div>
          </div>

          {/* ── Confirm screen ──────────────────────────────────────────────── */}
          {mode === 'confirm' ? (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-violet-600" />
                </div>
                <h1 className="text-gray-900 text-[24px] font-semibold mb-2">
                  Check your email
                </h1>
                <p className="text-gray-500 text-[14px]">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-gray-700">{pendingEmail.current}</span>.
                  Enter it below to confirm your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Confirmation code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={10}
                    className="input-field tracking-widest"
                  />
                </div>

                {error && (
                  <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[14px] font-medium transition-all mt-1',
                    busy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#18181B] hover:bg-black text-white shadow-sm'
                  )}
                >
                  {busy ? <><Spinner className="h-4 w-4" /> Confirming…</> : <>Confirm account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-[13px] text-gray-500 mt-6">
                Wrong email?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setCode(''); }}
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  Go back
                </button>
              </p>
            </>
          ) : (
            <>
              {/* ── Sign in / Sign up screen ──────────────────────────────── */}
              <div className="mb-8">
                <h1 className="text-gray-900 text-[24px] font-semibold mb-2">
                  {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-gray-500 text-[14px]">
                  {mode === 'signin' ? 'Sign in to continue to K-AI' : 'Get started with K-AI for free'}
                </p>
              </div>


              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="input-field"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-medium text-gray-700">Password</label>
                    {mode === 'signin' && (
                      // Disabled until password reset flow is implemented
                      <button
                        type="button"
                        disabled
                        className="text-[12px] text-gray-400 font-medium cursor-not-allowed opacity-50"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[14px] font-medium transition-all mt-1',
                    busy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#18181B] hover:bg-black text-white shadow-sm'
                  )}
                >
                  {busy ? (
                    <><Spinner className="h-4 w-4" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                  ) : (
                    <>{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* Toggle mode */}
              <p className="text-center text-[13px] text-gray-500 mt-6">
                {mode === 'signin' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); }}
                      className="text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); }}
                      className="text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>

            </>
          )}
        </div>
      </div>
    </div>
  );
}

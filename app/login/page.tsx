'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const confirmSignUp = useAuthStore((state) => state.confirmSignUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  // email used during signup — needed for the confirm step
  const pendingEmail = useRef('');

  useEffect(() => {
    if (user) router.replace('/chat');
  }, [user, router]);

  if (user) return null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function cognitoMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return (err as { message: string }).message;
    }
    return 'Something went wrong. Please try again.';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'confirm') {
      if (!code.trim()) { setError('Please enter the confirmation code.'); return; }
      setSubmitting(true);
      try {
        await confirmSignUp(pendingEmail.current, code.trim());
        // Auto sign-in after confirmation
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
        // redirect handled by the useEffect above
      }
    } catch (err) {
      setError(cognitoMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || isLoading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel — decorative */}
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white" style={{ fontSize: '15px', fontWeight: 600 }}>
            Chatbot App
          </span>
        </div>

        {/* Quote */}
        <div className="relative">
          <blockquote
            className="text-white/80 mb-4 leading-relaxed"
            style={{ fontSize: '15px' }}
          >
            &ldquo;Chatbot App has fundamentally changed how our team approaches research and
            code reviews. It&apos;s like having a senior engineer available 24/7.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-[11px] font-semibold">SK</span>
            </div>
            <div>
              <div className="text-white text-[13px] font-medium">Sarah Kim</div>
              <div className="text-white/50 text-[12px]">CTO at Axiom Labs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
              Chatbot App
            </span>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* CONFIRM screen                                                       */}
          {/* ------------------------------------------------------------------ */}
          {mode === 'confirm' ? (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-violet-600" />
                </div>
                <h1 className="text-gray-900 mb-2" style={{ fontSize: '24px', fontWeight: 600 }}>
                  Check your email
                </h1>
                <p className="text-gray-500" style={{ fontSize: '14px' }}>
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
                    className="w-full px-3.5 py-2.5 text-[14px] tracking-widest bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder-gray-400"
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
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[14px] font-medium transition-all mt-1 ${
                    busy
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#18181B] hover:bg-black text-white shadow-sm'
                  }`}
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Confirming…
                    </span>
                  ) : (
                    <>
                      Confirm account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
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
              {/* --------------------------------------------------------------- */}
              {/* SIGN IN / SIGN UP screen                                          */}
              {/* --------------------------------------------------------------- */}
              <div className="mb-8">
                <h1 className="text-gray-900 mb-2" style={{ fontSize: '24px', fontWeight: 600 }}>
                  {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h1>
                <p className="text-gray-500" style={{ fontSize: '14px' }}>
                  {mode === 'signin'
                    ? 'Sign in to continue to Chatbot App'
                    : 'Get started with Chatbot App for free'}
                </p>
              </div>

              {/* Social login */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all mb-4"
                style={{ fontSize: '14px' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all mb-6"
                style={{ fontSize: '14px' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-700" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Continue with GitHub
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[12px] text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
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
                    className="w-full px-3.5 py-2.5 text-[14px] bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder-gray-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-medium text-gray-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        className="text-[12px] text-violet-600 hover:text-violet-700 font-medium"
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
                      className="w-full px-3.5 py-2.5 pr-10 text-[14px] bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder-gray-400"
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
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[14px] font-medium transition-all mt-1 ${
                    busy
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#18181B] hover:bg-black text-white shadow-sm'
                  }`}
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                    </span>
                  ) : (
                    <>
                      {mode === 'signin' ? 'Sign in' : 'Create account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
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
                      onClick={() => setError('This app is private — registration is not open to the public.')}
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

              {/* Terms */}
              <p className="text-center text-[11px] text-gray-400 mt-4">
                By continuing, you agree to our{' '}
                <span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span>{' '}
                and{' '}
                <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

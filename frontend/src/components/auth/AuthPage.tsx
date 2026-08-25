import { useCallback, useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { SuryaMark } from '../common/SuryaMark';

function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (detail) return detail;
    if (!error.response) return 'The secure energy service is waking up or temporarily unavailable. Please try again in a moment.';
  }
  return 'Something went wrong. Please try again.';
}

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  const destination = (location.state as { from?: string } | null)?.from || '/dashboard';

  const finishAuth = useCallback(() => {
    navigate(destination, { replace: true });
  }, [destination, navigate]);

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle(credential);
      finishAuth();
    } catch (authError) {
      setError(errorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }, [finishAuth, signInWithGoogle]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) await signUp(fullName, email, password);
      else await signIn(email, password);
      finishAuth();
    } catch (authError) {
      setError(errorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  }

  if (user) return <Navigate to={destination} replace />;

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0e0c09] flex items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}hero-bg.jpg)` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.18),transparent_36%),radial-gradient(circle_at_90%_85%,rgba(16,185,129,0.14),transparent_34%),linear-gradient(135deg,rgba(8,13,11,0.82),rgba(8,13,11,0.96))]" />

      <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2.5 text-white">
        <SuryaMark size={40} className="shrink-0 drop-shadow-[0_0_10px_rgba(217,119,6,0.35)]" />
        <span className="font-bold text-lg tracking-tight">SURYA</span>
      </Link>

      <section className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-amber-500/20 bg-[#191511]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 text-emerald-300/80 text-xs uppercase tracking-[0.18em] font-semibold">
          <Leaf size={14} /> Secure platform access
        </div>
        <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {isSignup
            ? 'Start managing cleaner, smarter campus energy.'
            : 'Sign in to open your renewable energy command center.'}
        </p>

        <div className="mt-6">
          <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
        </div>

        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/30">
          <span className="h-px flex-1 bg-white/10" /> or use email <span className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <label className="block">
              <span className="text-xs font-medium text-white/65">Full name</span>
              <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 focus-within:border-amber-500/45 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
                <UserRound size={17} className="text-white/35" />
                <input
                  required
                  minLength={2}
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/25 outline-none"
                />
              </span>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-medium text-white/65">Email address</span>
            <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 focus-within:border-amber-500/45 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
              <Mail size={17} className="text-white/35" />
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/25 outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-white/65">Password</span>
            <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 focus-within:border-amber-500/45 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
              <LockKeyhole size={17} className="text-white/35" />
              <input
                required
                minLength={isSignup ? 8 : 1}
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/25 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="text-white/35 hover:text-white/70"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          {isSignup && (
            <label className="block">
              <span className="text-xs font-medium text-white/65">Confirm password</span>
              <span className="mt-1.5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3.5 focus-within:border-amber-500/45 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all">
                <LockKeyhole size={17} className="text-white/35" />
                <input
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/25 outline-none"
                />
              </span>
            </label>
          )}

          {error && (
            <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            disabled={submitting}
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(217,119,6,0.28)] hover:brightness-110 disabled:cursor-wait disabled:opacity-60 transition-all"
          >
            {submitting ? 'Connecting securely…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/45">
          {isSignup ? 'Already have an account?' : 'New to SURYA?'}{' '}
          <Link
            to={isSignup ? '/login' : '/signup'}
            state={location.state}
            className="font-semibold text-amber-300 hover:text-amber-200"
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </section>
    </main>
  );
}

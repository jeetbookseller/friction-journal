import { useState } from 'react';
import { useAuthContext } from './AuthProvider';

export function AuthForm() {
  const { signIn, signUp } = useAuthContext();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (mode === 'signup') setDone(true);
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError(null);
    setDone(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase">
            Productivity Hub - Personal Journal
          </span>
        </div>

        <div className="bg-surface-raised rounded-2xl p-6 shadow-card border border-border">
          <h1 className="text-lg font-semibold text-on-surface mb-6">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>

          {done ? (
            <div className="text-sm text-on-surface-muted text-center py-4">
              Check your email to confirm your account, then sign in.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-on-surface-muted uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-medium text-on-surface-muted uppercase tracking-wide">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-lg bg-accent text-on-accent px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                  : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-on-surface-muted">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={toggleMode} className="text-accent underline-offset-2 hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={toggleMode} className="text-accent underline-offset-2 hover:underline">
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

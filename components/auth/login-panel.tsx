'use client';
import { useState } from 'react';
import { ArrowLeft, GraduationCap, KeyRound, Loader2, Mail, ShieldCheck, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { demoSignIn } from '@/lib/auth/actions';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { useTurnstile } from '@/components/sx/turnstile';

export type LoginLabels = {
  email: string;
  emailPlaceholder: string;
  sendLink: string;
  sending: string;
  google: string;
  or: string;
  sentTitle: string;
  sentBody: string; // contains {email}
  code: string;
  haveCode: string;
  verify: string;
  useDifferent: string;
  invalidEmail: string;
  invalidCode: string;
  error: string;
  verifying: string;
  demoTitle: string;
  demoBody: string;
  demoStudent: string;
  demoCounsellor: string;
  demoAdmin: string;
  unavailable: string;
};

/**
 * Passwordless sign-in: email magic link (+ 6-digit code from the same email) or Google.
 * `allowSignup` is false for /admin. Staff accounts are created by invitation only.
 * In local demo mode (no Supabase) it offers one-click demo accounts instead.
 */
export function LoginPanel({ next, labels, demo, configured, allowSignup, demoRoles, google: googleEnabled = false }: { next: string; labels: LoginLabels; demo: boolean; configured: boolean; allowSignup: boolean; google?: boolean; demoRoles: ('student' | 'counsellor' | 'admin')[] }) {
  const router = useRouter();
  const turnstile = useTurnstile();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  // The email always has a link; it only has a code once the Supabase email templates include {{ .Token }}.
  const [showCode, setShowCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callback = () => `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;

  if (!demo && !configured) return <p className="form-error" role="alert">{labels.unavailable}</p>;

  if (demo) {
    const icons = { student: GraduationCap, counsellor: UserCog, admin: ShieldCheck } as const;
    const names = { student: labels.demoStudent, counsellor: labels.demoCounsellor, admin: labels.demoAdmin } as const;
    return (
      <div className="auth-demo">
        <p className="auth-demo-badge">{labels.demoTitle}</p>
        <p className="muted">{labels.demoBody}</p>
        <form action={demoSignIn} className="auth-demo-buttons">
          <input type="hidden" name="next" value={next} />
          {demoRoles.map((r) => {
            const Icon = icons[r];
            return (
              <button key={r} type="submit" name="role" value={r} className={`btn ${r === demoRoles[0] ? 'btn-primary' : 'btn-outline'} btn-block`}>
                <Icon size={18} aria-hidden /> {names[r]}
              </button>
            );
          })}
        </form>
      </div>
    );
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(labels.invalidEmail);
    if (turnstile.enabled && !turnstile.token) return setError(labels.verifying);
    setBusy(true);
    setError(null);
    const { error: err } = await createBrowserSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback(), shouldCreateUser: allowSignup, captchaToken: turnstile.token },
    });
    turnstile.reset();
    setBusy(false);
    if (err) setError(labels.error);
    else setStep('code');
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6,8}$/.test(code.trim())) return setError(labels.invalidCode);
    setBusy(true);
    setError(null);
    const { error: err } = await createBrowserSupabase().auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setBusy(false);
    if (err) return setError(labels.invalidCode);
    router.replace(next);
    router.refresh();
  }

  async function google() {
    setBusy(true);
    const { error: err } = await createBrowserSupabase().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback() } });
    if (err) {
      setBusy(false);
      setError(labels.error);
    }
  }

  if (step === 'code') {
    return (
      <form className="lead-form" onSubmit={verifyCode} noValidate>
        <div className="auth-sent">
          <Mail size={28} aria-hidden />
          <strong>{labels.sentTitle}</strong>
          <p className="muted">{labels.sentBody.replace('{email}', email)}</p>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {showCode ? (
          <>
            <label>
              {labels.code}
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="auth-code" aria-invalid={!!error} autoFocus />
            </label>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
              {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <KeyRound size={18} aria-hidden />} {labels.verify}
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-outline btn-block" onClick={() => setShowCode(true)}>
            <KeyRound size={16} aria-hidden /> {labels.haveCode}
          </button>
        )}
        <button type="button" className="booking-back" onClick={() => { setStep('email'); setCode(''); setError(null); setShowCode(false); }}>
          <ArrowLeft size={16} aria-hidden /> {labels.useDifferent}
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      {googleEnabled && (
        <>
          <button type="button" className="btn btn-outline btn-block btn-lg auth-google" onClick={google} disabled={busy}>
            <GoogleMark /> {labels.google}
          </button>
          <p className="auth-or"><span>{labels.or}</span></p>
        </>
      )}
      <form className="lead-form" onSubmit={sendLink} noValidate>
        {error && <p className="form-error" role="alert">{error}</p>}
        <label>
          {labels.email}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={labels.emailPlaceholder} autoComplete="email" aria-invalid={!!error} required />
        </label>
        {turnstile.element}
        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
          {busy ? <><Loader2 size={18} className="animate-spin" aria-hidden /> {labels.sending}</> : <><Mail size={18} aria-hidden /> {labels.sendLink}</>}
        </button>
      </form>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

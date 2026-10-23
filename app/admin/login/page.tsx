import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { LoginPanel, type LoginLabels } from '@/components/auth/login-panel';
import { demoAuth } from '@/lib/auth/mode';
import { getAuthProviders } from '@/lib/auth/providers';
import { safeNext } from '@/lib/auth/safe-next';
import { getViewer, isStaff } from '@/lib/auth/viewer';
import { isSupabaseConfigured } from '@/lib/env';

export const metadata: Metadata = { title: 'Staff sign-in' };

const LABELS: LoginLabels = {
  email: 'Work email',
  emailPlaceholder: 'you@stxavier.com.np',
  sendLink: 'Email me a sign-in link',
  sending: 'Sending…',
  google: 'Continue with Google',
  or: 'or',
  sentTitle: 'Check your email',
  sentBody: 'If {email} belongs to a staff account, a sign-in link and 6-digit code are on their way.',
  code: '6-digit code',
  verify: 'Sign in',
  useDifferent: 'Use a different email',
  invalidEmail: 'Please enter a valid email address.',
  invalidCode: 'That code is not valid or has expired.',
  error: 'Something went wrong. Please try again.',
  verifying: 'Just a moment — verifying you’re human.',
  demoTitle: 'Local demo mode',
  demoBody: 'Supabase isn’t connected. Sign in with a sample staff account — development only.',
  demoStudent: 'Demo student',
  demoCounsellor: 'Continue as demo counsellor',
  demoAdmin: 'Continue as demo admin',
  unavailable: 'Sign-in is not available until Supabase is configured.',
};

const ERRORS: Record<string, string> = {
  forbidden: 'This account does not have staff access. Ask an admin to grant you a role.',
  link_expired: 'That sign-in link has expired. Please request a new one.',
  link_invalid: 'That sign-in link is not valid.',
  not_configured: 'Sign-in is not available until Supabase is configured.',
};

export default function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  return (
    <main className="auth-wrap admin-auth">
      <section className="auth-card">
        <span className="auth-icon"><ShieldCheck size={28} aria-hidden /></span>
        <h1>Staff sign-in</h1>
        <p className="muted">St. Xavier Educational Network — admin dashboard</p>
        <Suspense fallback={<div className="auth-skel" aria-hidden />}>
          <Body searchParams={searchParams} />
        </Suspense>
        <p className="auth-help">Staff accounts are created by invitation from an admin.</p>
      </section>
    </main>
  );
}

async function Body({ searchParams }: { searchParams: PageProps<'/admin/login'>['searchParams'] }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === 'string' ? sp.next : null, '/admin');
  const viewer = await getViewer();
  if (isStaff(viewer)) redirect(next.startsWith('/admin') ? next : '/admin');
  const error = typeof sp.error === 'string' ? ERRORS[sp.error] : undefined;
  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      {viewer && !error && <p className="form-error" role="alert">{ERRORS.forbidden}</p>}
      <LoginPanel next={next.startsWith('/admin') ? next : '/admin'} labels={LABELS} demo={demoAuth} configured={isSupabaseConfigured} allowSignup={false} demoRoles={['admin', 'counsellor']} google={(await getAuthProviders()).google} />
    </>
  );
}

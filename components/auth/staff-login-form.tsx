'use client';
import { useActionState, useState } from 'react';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { staffSignIn, type StaffSignInState } from '@/app/admin/login/actions';

/** Email + password form for staff (accounts are created by an admin in Users & roles). */
export function StaffLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<StaffSignInState, FormData>(staffSignIn, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="lead-form">
      <input type="hidden" name="next" value={next} />
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <label>
        Work email
        <input type="email" name="email" autoComplete="username" placeholder="you@stxavier.com.np" required aria-invalid={!!state?.error} />
      </label>
      <label>
        Password
        <span className="pw-field">
          <input type={show ? 'text' : 'password'} name="password" autoComplete="current-password" required aria-invalid={!!state?.error} />
          <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </span>
      </label>
      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={pending}>
        {pending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <LogIn size={18} aria-hidden />} Sign in
      </button>
    </form>
  );
}

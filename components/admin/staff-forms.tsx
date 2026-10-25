'use client';
import { useActionState, useId, useState } from 'react';
import { KeyRound, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { addStaff, changeMyPassword, setStaffPassword, type StaffFormState } from '@/app/admin/actions';

/** Readable random password (no 0/O, 1/l/I) from the browser's secure random source. */
function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function Status({ state }: { state: StaffFormState }) {
  if (state?.error) return <p className="form-error" role="alert">{state.error}</p>;
  if (state?.ok) return <p className="form-ok" role="status">{state.ok}</p>;
  return null;
}

/** Password input with Generate; the value stays visible so the admin can copy it for the new staff member. */
function NewPasswordField({ label = 'Password' }: { label?: string }) {
  const [value, setValue] = useState('');
  const id = useId();
  return (
    <div className="staff-pw">
      <label htmlFor={id}>{label}</label>
      <span className="staff-pw-row">
        <input id={id} name="password" type="text" value={value} onChange={(e) => setValue(e.target.value)} minLength={10} maxLength={72} autoComplete="new-password" spellCheck={false} required />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setValue(generatePassword())}>
          <RefreshCw size={14} aria-hidden /> Generate
        </button>
      </span>
      <small className="muted">At least 10 characters. Share it with them privately (in person or by phone).</small>
    </div>
  );
}

export function AddStaffForm() {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(addStaff, null);
  return (
    <form action={action} className="staff-form" key={state?.ok ? state.ok : 'add'}>
      <Status state={state} />
      <div className="staff-grid">
        <label>
          Full name
          <input name="name" required maxLength={100} autoComplete="off" />
        </label>
        <label>
          Email
          <input name="email" type="email" required maxLength={200} autoComplete="off" />
        </label>
        <label>
          Role
          <select name="role" defaultValue="counsellor">
            <option value="counsellor">Counsellor: leads, bookings, applications</option>
            <option value="admin">Admin: everything, incl. staff & website content</option>
          </select>
        </label>
        <NewPasswordField />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <UserPlus size={16} aria-hidden />} Add staff member
      </button>
    </form>
  );
}

export function SetPasswordForm({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(setStaffPassword, null);
  return (
    <details className="staff-setpw">
      <summary>Set new password</summary>
      <form action={action} className="staff-form" aria-label={`New password for ${name}`}>
        <input type="hidden" name="id" value={userId} />
        <Status state={state} />
        <NewPasswordField label={`New password for ${name}`} />
        <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <KeyRound size={14} aria-hidden />} Save password
        </button>
      </form>
    </details>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<StaffFormState, FormData>(changeMyPassword, null);
  return (
    <form action={action} className="staff-form staff-narrow" key={state?.ok ? state.ok : 'change'}>
      <Status state={state} />
      <label>
        Current password
        <input name="current" type="password" autoComplete="current-password" required />
      </label>
      <label>
        New password
        <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required />
        <small className="muted">At least 10 characters.</small>
      </label>
      <label>
        Confirm new password
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={72} required />
      </label>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <KeyRound size={16} aria-hidden />} Change password
      </button>
    </form>
  );
}

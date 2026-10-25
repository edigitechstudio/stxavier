import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { env } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Staff accounts use email + password, created by an admin. No sign-in emails involved.
 * Students keep passwordless sign-in (email link / code, Google).
 */

export const PASSWORD_MIN = 10;
// bcrypt (used by Supabase Auth) ignores anything past 72 bytes.
export const password = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(72, 'Use at most 72 characters.');
export const staffEmail = z.string().trim().toLowerCase().email('Enter a valid email address.').max(200);

export type StaffRole = 'counsellor' | 'admin';

/**
 * Creates a staff login, or turns an existing account (e.g. someone who once used the student
 * portal) into staff with the given password. Returns whether the account already existed.
 */
export async function createStaffAccount(input: { name: string; email: string; role: StaffRole; password: string }) {
  const db = createServiceClient();
  const { data: existing } = await db.from('profiles').select('id').ilike('email', input.email).maybeSingle();

  let id: string;
  if (existing) {
    id = existing.id;
    const { error } = await db.auth.admin.updateUserById(id, { password: input.password, email_confirm: true, user_metadata: { full_name: input.name } });
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // nobody has to click a confirmation email
      user_metadata: { full_name: input.name },
    });
    if (error || !data.user) throw new Error(error?.message ?? 'Could not create the account.');
    id = data.user.id;
  }
  // The service role may set roles (the profile trigger only blocks signed-in non-admins).
  const { error } = await db.from('profiles').update({ role: input.role, full_name: input.name }).eq('id', id);
  if (error) throw new Error(error.message);
  return { id, existed: !!existing };
}

export async function setUserPassword(id: string, newPassword: string) {
  const { error } = await createServiceClient().auth.admin.updateUserById(id, { password: newPassword });
  if (error) throw new Error(error.message);
}

/** Checks a password without touching the visitor's session (a throwaway client that stores nothing). */
export async function passwordMatches(email: string, pw: string) {
  const probe = createClient(env.supabaseUrl, env.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await probe.auth.signInWithPassword({ email, password: pw });
  if (data.session) await probe.auth.signOut({ scope: 'local' });
  return !error && !!data.user;
}

'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { safeNext } from '@/lib/auth/safe-next';
import { staffEmail } from '@/lib/auth/staff';
import { isSupabaseConfigured } from '@/lib/env';
import { rateLimit } from '@/lib/ratelimit';
import { createSessionClient } from '@/lib/supabase/server';

export type StaffSignInState = { error: string } | null;

/** Staff sign-in with email + password. Wrong email and wrong password get the same message. */
export async function staffSignIn(_prev: StaffSignInState, f: FormData): Promise<StaffSignInState> {
  if (!isSupabaseConfigured) return { error: 'Sign-in is not available until Supabase is configured.' };
  const email = staffEmail.safeParse(f.get('email'));
  const pw = String(f.get('password') ?? '');
  if (!email.success || !pw || pw.length > 200) return { error: 'Enter your email and password.' };
  const target = safeNext(String(f.get('next') ?? ''), '/admin');
  const next = target.startsWith('/admin') ? target : '/admin';

  // Slow down password guessing: per network and per account.
  const h = await headers();
  const ip = h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const [byIp, byEmail] = await Promise.all([rateLimit('staff-login-ip', ip, 20, 900), rateLimit('staff-login-email', email.data, 8, 900)]);
  if (!byIp || !byEmail) return { error: 'Too many attempts. Please wait 15 minutes and try again.' };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password: pw });
  if (error || !data.user) return { error: 'Email or password is incorrect.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'counsellor') {
    await supabase.auth.signOut();
    return { error: 'This account does not have staff access. Ask an admin to add you as staff.' };
  }
  redirect(next);
}

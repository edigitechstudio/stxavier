'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { demoStore, DEMO_USERS } from '@/lib/portal/demo-store';
import { isSupabaseConfigured } from '@/lib/env';
import { createSessionClient } from '@/lib/supabase/server';
import { DEMO_COOKIE, demoAuth } from './mode';
import { safeNext } from './safe-next';

/** Local development only: sign in as a seeded demo user. */
export async function demoSignIn(formData: FormData) {
  if (!demoAuth) throw new Error('Demo sign-in is disabled');
  const role = String(formData.get('role')) as keyof typeof DEMO_USERS;
  const id = DEMO_USERS[role];
  if (!id || !demoStore().profiles.some((p) => p.id === id)) throw new Error('Unknown demo user');
  (await cookies()).set(DEMO_COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 });
  redirect(safeNext(String(formData.get('next') ?? ''), role === 'student' ? '/en/portal' : '/admin'));
}

export async function signOut(formData: FormData) {
  const to = safeNext(String(formData.get('next') ?? ''), '/en');
  if (demoAuth) (await cookies()).delete(DEMO_COOKIE);
  else if (isSupabaseConfigured) await (await createSessionClient()).auth.signOut();
  redirect(to);
}

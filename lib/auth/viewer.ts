import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { demoStore } from '@/lib/portal/demo-store';
import { createSessionClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import type { UserRole, Viewer } from '@/types/portal';
import { DEMO_COOKIE, demoAuth } from './mode';

/**
 * Data Access Layer entry point: who is signed in? Reads the session cookie, so call it only
 * inside a <Suspense> boundary (or a route handler / server action). Memoised per request.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Everything behind a session is per-request (clock reads, private data) — never prerendered.
  await connection();
  if (demoAuth) {
    const id = (await cookies()).get(DEMO_COOKIE)?.value;
    const p = id ? demoStore().profiles.find((x) => x.id === id) : undefined;
    return p ? { id: p.id, email: p.email ?? '', name: p.full_name ?? p.email ?? 'User', role: p.role } : null;
  }
  if (!isSupabaseConfigured) return null;

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // verifies the JWT with Supabase — never trust getSession() on the server
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role, full_name, email').eq('id', user.id).maybeSingle();
  const role = (profile?.role ?? 'student') as UserRole;
  const name = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email || 'User';
  return { id: user.id, email: user.email ?? profile?.email ?? '', name, role };
});

export const isStaff = (v: Viewer | null): v is Viewer => !!v && (v.role === 'counsellor' || v.role === 'admin');

/** Students (and staff previewing) — redirects to the localized portal login. */
export async function requireViewer(locale: string, next = `/${locale}/portal`): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect(`/${locale}/portal/login?next=${encodeURIComponent(next)}`);
  return v;
}

/** Counsellors and admins. */
export async function requireStaff(next = '/admin'): Promise<Viewer> {
  const v = await getViewer();
  if (!v) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  if (!isStaff(v)) redirect('/admin/login?error=forbidden');
  return v;
}

export async function requireAdmin(): Promise<Viewer> {
  const v = await requireStaff();
  if (v.role !== 'admin') redirect('/admin?error=admin_only');
  return v;
}

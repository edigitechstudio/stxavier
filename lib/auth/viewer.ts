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
  // Everything behind a session is per-request (clock reads, private data). Never prerendered.
  await connection();
  if (demoAuth) {
    const id = (await cookies()).get(DEMO_COOKIE)?.value;
    const p = id ? demoStore().profiles.find((x) => x.id === id) : undefined;
    return p ? { id: p.id, email: p.email ?? '', name: p.full_name || nameFromEmail(p.email), role: p.role } : null;
  }
  if (!isSupabaseConfigured) return null;

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // verifies the JWT with Supabase. Never trust getSession() on the server
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role, full_name, email').eq('id', user.id).maybeSingle();
  const role = (profile?.role ?? 'student') as UserRole;
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = profile?.full_name || meta?.full_name || meta?.name || nameFromEmail(user.email);
  return { id: user.id, email: user.email ?? profile?.email ?? '', name, role };
});

/**
 * A friendly display name when the profile has none, instead of showing the whole email:
 * "john.smith42@gmail.com" → "John Smith", "pyakurelprajal@gmail.com" → "Pyakurelprajal".
 */
export function nameFromEmail(email: string | null | undefined): string {
  const local = (email ?? '').split('@')[0];
  const words = local.split(/[._\-+\d]+/).filter(Boolean);
  if (!words.length) return local || 'User';
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export const isStaff = (v: Viewer | null): v is Viewer => !!v && (v.role === 'counsellor' || v.role === 'admin');

/** Students (and staff previewing), redirects to the localized portal login. */
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

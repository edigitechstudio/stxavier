import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { DEMO_COOKIE, demoAuth } from '@/lib/auth/mode';
import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Refreshes the Supabase auth session (rotating cookies onto `res`) and reports whether someone
 * appears signed in. This is an optimistic check for redirects only — pages and actions still
 * verify the user and their role close to the data.
 */
export async function refreshSession(req: NextRequest, res: NextResponse): Promise<boolean> {
  if (demoAuth) return req.cookies.has(DEMO_COOKIE);
  if (!isSupabaseConfigured) return false;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

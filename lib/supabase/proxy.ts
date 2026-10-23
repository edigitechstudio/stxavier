import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { DEMO_COOKIE, demoAuth } from '@/lib/auth/mode';
import { env, isSupabaseConfigured } from '@/lib/env';

type CookieToSet = { name: string; value: string; options?: Parameters<NextResponse['cookies']['set']>[2] };

/**
 * Refreshes the Supabase auth session and reports whether someone appears signed in. This is an
 * optimistic check for redirects only — pages and actions still verify the user and their role.
 *
 * Call it BEFORE building the response: refreshed tokens are written onto `req.cookies`, so a
 * response created afterwards (NextResponse.next({ request }) or next-intl) forwards them to the
 * page. Supabase rotates refresh tokens, so a page that still saw the old cookies would fail to
 * refresh, look signed out and redirect to login — an endless loop. Then apply `cookies` to the
 * response with `applyCookies` so the browser stores the new tokens too.
 */
export async function refreshSession(req: NextRequest): Promise<{ signedIn: boolean; cookies: CookieToSet[] }> {
  if (demoAuth) return { signedIn: req.cookies.has(DEMO_COOKIE), cookies: [] };
  if (!isSupabaseConfigured) return { signedIn: false, cookies: [] };

  const cookies: CookieToSet[] = [];
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => req.cookies.set(name, value));
        cookies.push(...toSet);
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { signedIn: !!user, cookies };
}

export function applyCookies(res: NextResponse, cookies: CookieToSet[]) {
  cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
  return res;
}

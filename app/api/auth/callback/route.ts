import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext } from '@/lib/auth/safe-next';
import { isSupabaseConfigured } from '@/lib/env';
import { createSessionClient } from '@/lib/supabase/server';

/**
 * Landing point for Supabase magic links, invites and Google OAuth. Exchanges the one-time
 * code / token for a session cookie, then continues to `next` (same-site paths only).
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNext(url.searchParams.get('next'), '/en/portal');
  const loginPath = next.startsWith('/admin') ? '/admin/login' : `/${next.split('/')[1] === 'ne' ? 'ne' : 'en'}/portal/login`;
  const fail = (reason: string) => NextResponse.redirect(new URL(`${loginPath}?error=${reason}&next=${encodeURIComponent(next)}`, url.origin));

  if (!isSupabaseConfigured) return fail('not_configured');
  const supabase = await createSessionClient();

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail('link_expired');
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail('link_expired');
  } else {
    return fail('link_invalid');
  }
  return NextResponse.redirect(new URL(next, url.origin));
}

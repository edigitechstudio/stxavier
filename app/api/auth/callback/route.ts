import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext } from '@/lib/auth/safe-next';
import { isSupabaseConfigured } from '@/lib/env';
import { createSessionClient } from '@/lib/supabase/server';

function loginPathFor(next: string) {
  return next.startsWith('/admin') ? '/admin/login' : `/${next.split('/')[1] === 'ne' ? 'ne' : 'en'}/portal/login`;
}

/** Supabase error codes for links that were used, replaced by a newer link, or timed out. */
const EXPIRED = /otp_expired|expired|flow_state_not_found|invalid.*(token|grant)/i;

/**
 * Landing point for Supabase sign-in links, invites and Google OAuth.
 * - `?code=` (PKCE: links requested from the login form, Google) → exchanged for a session cookie.
 * - `?token_hash=&type=` (custom email templates) → verified.
 * - `?error_code=` → Supabase refused the link (used, replaced by a newer one, or expired).
 * - Nothing in the query: invites and links sent from the Supabase dashboard put the tokens in the
 *   URL fragment (`#access_token=…`), which browsers never send to the server. A tiny page reads the
 *   fragment and POSTs the tokens back here, where they are verified and stored as cookies.
 * Then continues to `next` (same-site paths only).
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNext(url.searchParams.get('next'), '/en/portal');
  const loginPath = loginPathFor(next);
  const fail = (reason: string) => NextResponse.redirect(new URL(`${loginPath}?error=${reason}&next=${encodeURIComponent(next)}`, url.origin));

  if (!isSupabaseConfigured) return fail('not_configured');

  const errorCode = url.searchParams.get('error_code') ?? url.searchParams.get('error');
  if (errorCode) {
    const detail = `${errorCode} ${url.searchParams.get('error_description') ?? ''}`;
    return fail(EXPIRED.test(detail) ? 'link_expired' : 'link_invalid');
  }

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(EXPIRED.test(`${error.code ?? ''} ${error.message}`) || /verifier/i.test(error.message) ? 'link_expired' : 'link_invalid');
    return NextResponse.redirect(new URL(next, url.origin));
  }
  if (tokenHash && type) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail('link_expired');
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // Tokens (or an error) are in the URL fragment: hand them over from the browser.
  // JSON-encode values for the inline script; escaping "<" keeps a "</script>" in them from closing it.
  const js = (v: string) => JSON.stringify(v).replace(/</g, '\\u003c');
  const failBase = `${loginPath}?next=${encodeURIComponent(next)}&error=`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signing you in…</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:600 16px system-ui,sans-serif;color:#0b1f4b;background:#f6f8fd}</style></head>
<body><p>Signing you in…</p><script>
(function () {
  var h = new URLSearchParams(location.hash.slice(1));
  var go = function (reason) { location.replace(${js(failBase)} + reason); };
  if (h.get('error') || h.get('error_code')) return go(/expired/i.test((h.get('error_code') || '') + (h.get('error_description') || '')) ? 'link_expired' : 'link_invalid');
  if (!h.get('access_token') || !h.get('refresh_token')) return go('link_invalid');
  fetch(location.pathname + location.search, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token') })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d && d.ok) location.replace(${js(next)}); else go('link_expired');
  }).catch(function () { go('link_invalid'); });
})();
</script></body></html>`;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

/** Second half of the fragment flow above: verify the tokens with Supabase and set the session cookies. */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false }, { status: 503 });
  // Same-origin only (the page above), so another site can't plant a session.
  const origin = req.headers.get('origin');
  if (!origin || origin !== req.nextUrl.origin) return NextResponse.json({ ok: false }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { access_token?: unknown; refresh_token?: unknown } | null;
  if (typeof body?.access_token !== 'string' || typeof body?.refresh_token !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.setSession({ access_token: body.access_token, refresh_token: body.refresh_token });
  // setSession only decodes the access token; confirm it with Supabase before trusting it.
  if (error || !data.session) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: check } = await supabase.auth.getUser();
  if (!check.user) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true });
}

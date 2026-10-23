import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { refreshSession } from './lib/supabase/proxy';

const intl = createMiddleware(routing);
const PORTAL = /^\/(en|ne)\/portal(?:\/|$)/;
const PUBLIC_AUTH = /^\/(?:(?:en|ne)\/portal|admin)\/login(?:\/|$)/;

function toLogin(req: NextRequest, loginPath: string) {
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

/**
 * - Localized site: next-intl locale routing.
 * - /portal and /admin: refresh the auth session and send signed-out visitors to the login page.
 *   Role checks (student vs staff) happen in the pages and server actions themselves.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const res = NextResponse.next({ request: req });
    const signedIn = await refreshSession(req, res);
    if (!signedIn && !PUBLIC_AUTH.test(pathname)) return toLogin(req, '/admin/login');
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  const res = intl(req);
  const portal = PORTAL.exec(pathname);
  if (portal) {
    const signedIn = await refreshSession(req, res);
    if (!signedIn && !PUBLIC_AUTH.test(pathname)) return toLogin(req, `/${portal[1]}/portal/login`);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export const config = {
  // Skip API routes, Next internals and any path with a file extension (sitemap.xml, robots.txt,
  // llms.txt, images…). Note the double backslash: the matcher is a string, so "\\." is a literal dot.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

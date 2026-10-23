/** Only same-site relative paths may be used as post-login redirects (no open redirects). */
export function safeNext(next: string | null | undefined, fallback: string) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  return next;
}

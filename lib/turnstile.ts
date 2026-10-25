import 'server-only';

let warned = false;

/**
 * Verifies a Cloudflare Turnstile token. Enforced whenever TURNSTILE_SECRET_KEY is set.
 * Without it, verification is skipped with a one-time warning (rate limiting and honeypots still
 * apply), so a missing key never silently blocks every enquiry.
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (!warned && process.env.NODE_ENV === 'production') {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY is not set. Bot protection is disabled.');
      warned = true;
    }
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, ...(ip && ip !== 'unknown' ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}

import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * After the first message passes the bot check (Turnstile), the browser gets a signed,
 * short-lived chat token so follow-up messages don't need a new challenge.
 */
const TTL_MS = 2 * 60 * 60 * 1000;
const devSecret = randomBytes(32).toString('hex');
const secret = () => process.env.CHAT_SESSION_SECRET || process.env.REVALIDATE_SECRET || devSecret;

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function issueChatToken(now = Date.now()) {
  const payload = `${randomBytes(9).toString('base64url')}.${now + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the session id for a valid, unexpired token, else null. */
export function verifyChatToken(token: string | undefined | null, now = Date.now()): string | null {
  const parts = token?.split('.');
  if (!parts || parts.length !== 3) return null;
  const [id, exp, mac] = parts;
  const expected = Buffer.from(sign(`${id}.${exp}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Number(exp) > now ? id : null;
}

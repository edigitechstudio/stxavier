import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Sliding-window rate limiter. Uses Upstash Redis in production (shared across serverless
 * instances); falls back to a per-instance in-memory window for local development.
 */
const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasUpstash ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();
const memory = new Map<string, number[]>();

export async function rateLimit(bucket: string, key: string, limit: number, windowSeconds: number) {
  if (redis) {
    const id = `${bucket}:${limit}:${windowSeconds}`;
    let limiter = limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`), prefix: `rl:${bucket}` });
      limiters.set(id, limiter);
    }
    const { success } = await limiter.limit(key);
    return success;
  }
  const now = Date.now();
  const hits = (memory.get(`${bucket}:${key}`) ?? []).filter((t) => now - t < windowSeconds * 1000);
  hits.push(now);
  memory.set(`${bucket}:${key}`, hits);
  return hits.length <= limit;
}

/** Best-effort client IP from the platform's proxy headers. */
export function clientIp(req: Request) {
  return req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

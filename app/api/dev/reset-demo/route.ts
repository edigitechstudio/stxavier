import { revalidateTag } from 'next/cache';
import { demoAuth } from '@/lib/auth/mode';
import { CONTENT_TAGS } from '@/lib/content';

/**
 * Local demo mode only: wipe the in-memory portal, booking and edited-content data back to the
 * seed, and expire the cached pages so they show it immediately (used by e2e tests).
 */
export async function POST() {
  if (!demoAuth) return new Response('Not found', { status: 404 });
  const g = globalThis as Record<string, unknown>;
  delete g.__sxPortal;
  delete g.__sxAvailability;
  delete g.__sxContent;
  const bookings = g.__sxBookings as { bookings: unknown[] } | undefined;
  if (bookings) bookings.bookings.length = 0;
  for (const tag of new Set([...Object.values(CONTENT_TAGS), 'blog'])) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true });
}

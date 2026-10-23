import { z } from 'zod';
import { availableDays } from '@/lib/booking/service';
import { bookingStoreAvailable } from '@/lib/booking/store';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { BOOKING_MODES } from '@/types/booking';

const query = z.object({
  counsellor: z.string().regex(/^[a-z0-9-]{1,80}$/),
  mode: z.enum(BOOKING_MODES),
});

/** Free slots for a counsellor (or "any") and meeting mode, grouped by Nepal calendar day. */
export async function GET(req: Request) {
  if (!(await rateLimit('slots', clientIp(req), 60, 60))) return Response.json({ error: 'rate_limited' }, { status: 429 });
  if (!bookingStoreAvailable()) return Response.json({ error: 'not_configured' }, { status: 503 });

  const url = new URL(req.url);
  const parsed = query.safeParse({ counsellor: url.searchParams.get('counsellor'), mode: url.searchParams.get('mode') });
  if (!parsed.success) return Response.json({ error: 'invalid' }, { status: 400 });

  const days = await availableDays(parsed.data.counsellor, parsed.data.mode);
  return Response.json({ days }, { headers: { 'Cache-Control': 'no-store' } });
}

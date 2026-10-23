import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { CONTENT_TAGS, type ContentTable } from '@/lib/content';

/**
 * On-demand content refresh. Called by:
 *  - a Supabase Database Webhook on each content table (payload has `table`), or
 *  - the admin dashboard after an edit (payload has `tables`).
 * Auth: `Authorization: Bearer <REVALIDATE_SECRET>`.
 */
const body = z.union([
  z.object({ table: z.string() }),
  z.object({ tables: z.array(z.string()).min(1) }),
]);

function authorized(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid body' }, { status: 400 });

  const tables = 'table' in parsed.data ? [parsed.data.table] : parsed.data.tables;
  // Non-table caches can be refreshed by name too (e.g. after publishing a blog post).
  const EXTRA = ['blog', 'google-reviews', 'rates', 'clock'];
  const tags = [
    ...tables.filter((t): t is ContentTable => t in CONTENT_TAGS).map((t) => CONTENT_TAGS[t]),
    ...tables.filter((t) => EXTRA.includes(t)),
  ];

  tags.forEach((tag) => revalidateTag(tag, 'max'));
  return Response.json({ revalidated: tags });
}

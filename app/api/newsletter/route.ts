import { z } from 'zod';
import { isSupabaseConfigured } from '@/lib/env';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTurnstile } from '@/lib/turnstile';

const schema = z.object({
  email: z.email().max(254),
  locale: z.enum(['en', 'ne']).default('en'),
  website: z.string().max(0).optional(), // honeypot must stay empty
  turnstile_token: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit('newsletter', ip, 5, 600))) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    // A filled honeypot gets a fake success so bots learn nothing.
    return parsed.error.issues.some((i) => i.path[0] === 'website')
      ? Response.json({ ok: true })
      : Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  if (!(await verifyTurnstile(parsed.data.turnstile_token, ip))) {
    return Response.json({ error: 'bot_check_failed' }, { status: 403 });
  }

  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[newsletter] Supabase not configured. Subscription not stored');
    return Response.json({ error: 'Not configured' }, { status: 503 });
  }

  const { error } = await createServiceClient()
    .from('newsletter_subscribers')
    .upsert(
      { email: parsed.data.email.toLowerCase(), locale: parsed.data.locale, unsubscribed_at: null },
      { onConflict: 'email' },
    );
  if (error) {
    console.error('[newsletter]', error.message);
    return Response.json({ error: 'Could not subscribe' }, { status: 500 });
  }
  return Response.json({ ok: true });
}

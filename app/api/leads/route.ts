import { after } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getDestination } from '@/lib/content';
import { guideEmail, leadNotification } from '@/lib/email/templates';
import { sendEmail, staffRecipients } from '@/lib/email/send';
import { env, isSupabaseConfigured } from '@/lib/env';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTurnstile } from '@/lib/turnstile';
import { leadSchema } from '@/lib/validation/lead';
import { recordDevLead } from '@/lib/portal/admin';

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit('leads', ip, 5, 600))) {
    return Response.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsed = leadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    // Bots that fill the honeypot get a fake success.
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return Response.json({ ok: true });
    return Response.json(
      { error: 'invalid', issues: parsed.error.issues.map((i) => i.path.join('.')) },
      { status: 400 },
    );
  }
  const lead = parsed.data;

  if (!(await verifyTurnstile(lead.turnstile_token, ip))) {
    return Response.json({ error: 'bot_check_failed' }, { status: 403 });
  }

  const payload = {
    destination: lead.destination,
    intake: lead.intake,
    field: lead.field,
    course: lead.course,
    counsellor: lead.counsellor,
    message: lead.message,
    answers: lead.answers,
  };

  let stored = false;
  if (isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await createServiceClient()
      .from('leads')
      .insert({
        source: lead.source,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || null,
        payload,
        page_path: lead.page_path,
        referrer: lead.referrer,
        locale: lead.locale,
        ...lead.utm,
      });
    if (error) {
      console.error('[leads]', error.message);
      return Response.json({ error: 'store_failed' }, { status: 500 });
    }
    stored = true;
  } else if (env.isProduction) {
    return Response.json({ error: 'not_configured' }, { status: 503 });
  } else {
    // Local development without a database: keep it in memory so it appears in /admin/leads.
    recordDevLead({
      source: lead.source,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      payload,
      page_path: lead.page_path ?? null,
      referrer: lead.referrer ?? null,
      locale: lead.locale,
      utm: lead.utm,
    });
  }

  // Guide download: work out the link now so it can be returned and emailed.
  let guideUrl: string | null = null;
  const guideSlug =
    lead.source === 'guide_download' && typeof lead.answers?.guide === 'string' ? lead.answers.guide : null;
  if (guideSlug) {
    const d = await getDestination(guideSlug);
    if (d) guideUrl = d.guide_pdf ?? `${env.siteUrl}/${lead.locale}/guides/${d.slug}`;
  }

  // Emails never delay (or fail) the response.
  after(async () => {
    const details = Object.fromEntries(
      Object.entries({ ...payload, ...(lead.answers ?? {}) }).filter(
        ([k, v]) => k !== 'answers' && v !== undefined && v !== null && v !== '',
      ),
    );
    const note = leadNotification({
      source: lead.source,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      page: lead.page_path,
      details,
    });
    await sendEmail({ to: staffRecipients(), ...note, replyTo: lead.email || null });
    if (guideUrl && lead.email) {
      // Email wording is editable in the dashboard (Interface text → Printable guides).
      const t = await getTranslations({ locale: lead.locale, namespace: 'guide' });
      const copy = { subject: t('emailSubject'), intro: t('emailIntro'), button: t('emailButton') };
      await sendEmail({
        to: lead.email,
        ...guideEmail({ name: lead.name, country: guideSlug ?? '', url: guideUrl }, copy),
      });
    }
  });

  return Response.json({ ok: true, stored, ...(guideUrl ? { guideUrl } : {}) });
}

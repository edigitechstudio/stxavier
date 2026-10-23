import { after } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { slotInput } from '@/lib/booking/service';
import { findSlot } from '@/lib/booking/slots';
import { bookingStoreAvailable, insertBooking } from '@/lib/booking/store';
import { bookingConfirmation, bookingNotification } from '@/lib/email/templates';
import { sendEmail, staffRecipients } from '@/lib/email/send';
import { env, isSupabaseConfigured } from '@/lib/env';
import { l } from '@/lib/i18n/localize';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { createServiceClient } from '@/lib/supabase/service';
import { verifyTurnstile } from '@/lib/turnstile';
import { isValidNepaliPhone, normalizeNepaliPhone } from '@/lib/validation/phone';
import { BOOKING_MODES } from '@/types/booking';
import { recordDevLead } from '@/lib/portal/admin';

const schema = z.object({
  counsellor: z.string().regex(/^[a-z0-9-]{1,80}$/),
  mode: z.enum(BOOKING_MODES),
  start: z.iso.datetime(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().refine(isValidNepaliPhone, 'invalid_phone').transform(normalizeNepaliPhone),
  email: z.union([z.email().max(254), z.literal('')]).optional(),
  notes: z.string().trim().max(1000).optional(),
  locale: z.enum(['en', 'ne']).default('en'),
  page_path: z.string().max(300).optional(),
  utm: z.record(z.string().max(20), z.string().max(200)).default({}),
  website: z.string().max(0).optional(), // honeypot
  turnstile_token: z.string().optional(),
});

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit('bookings', ip, 5, 600))) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return Response.json({ ok: true });
    return Response.json({ error: 'invalid', issues: parsed.error.issues.map((i) => i.path.join('.')) }, { status: 400 });
  }
  const b = parsed.data;
  if (!(await verifyTurnstile(b.turnstile_token, ip))) return Response.json({ error: 'bot_check_failed' }, { status: 403 });
  if (!bookingStoreAvailable()) return Response.json({ error: 'not_configured' }, { status: 503 });

  // Re-validate against live availability — never trust the client's slot.
  const { input, settings, team } = await slotInput(b.counsellor, b.mode);
  const slot = findSlot(input, b.start);
  if (!slot) return Response.json({ error: 'conflict' }, { status: 409 });

  const utm = Object.fromEntries(UTM_KEYS.map((k) => [k, b.utm[k]]).filter(([, v]) => v));
  const result = await insertBooking({
    counsellor: slot.counsellor,
    mode: b.mode,
    starts_at: slot.start,
    ends_at: slot.end,
    name: b.name,
    phone: b.phone,
    email: b.email || null,
    notes: b.notes || null,
    locale: b.locale,
    page_path: b.page_path ?? null,
    utm,
  });
  if (!result.ok) return Response.json({ error: result.reason }, { status: result.reason === 'conflict' ? 409 : 500 });
  const booking = result.booking;
  const counsellor = team.find((c) => c.slug === booking.counsellor);

  after(async () => {
    const t = await getTranslations({ locale: b.locale, namespace: 'booking' });
    const tz = 'Asia/Kathmandu';
    const fmtLocale = b.locale === 'ne' ? 'ne-NP' : 'en-GB';
    const whenLabel = `${new Intl.DateTimeFormat(fmtLocale, { dateStyle: 'full', timeZone: tz }).format(new Date(booking.starts_at))}, ${new Intl.DateTimeFormat(fmtLocale, { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(booking.starts_at))} NPT`;
    const modeNote = l(b.mode === 'office' ? settings.office_address : b.mode === 'zoom' ? settings.zoom_note : settings.whatsapp_note, b.locale) ?? '';
    const info = {
      reference: booking.reference,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      counsellor: counsellor?.name ?? booking.counsellor,
      modeLabel: t(`modes.${b.mode}`),
      whenLabel,
      modeNote,
      notes: booking.notes,
      manageNote: t('email.manage'),
    };

    // Also record the booking as a lead so the team works from one inbox.
    if (isSupabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await createServiceClient()
        .from('leads')
        .insert({ source: 'booking', name: booking.name, phone: booking.phone, email: booking.email, payload: { reference: booking.reference, counsellor: booking.counsellor, mode: b.mode, starts_at: booking.starts_at }, page_path: booking.page_path, locale: b.locale, ...utm });
    } else if (!env.isProduction) {
      recordDevLead({ source: 'booking', name: booking.name, phone: booking.phone, email: booking.email, payload: { reference: booking.reference, counsellor: booking.counsellor, mode: b.mode, starts_at: booking.starts_at }, page_path: booking.page_path, referrer: null, locale: b.locale, utm });
    }
    await sendEmail({ to: staffRecipients(), ...bookingNotification(info), replyTo: booking.email });
    if (booking.email) {
      const confirmation = bookingConfirmation(info, {
        title: t('email.title'),
        intro: t('email.intro', { name: booking.name }),
        reference: t('reference'),
        counsellor: t('summary.counsellor'),
        when: t('summary.when'),
        mode: t('summary.mode'),
      });
      await sendEmail({ to: booking.email, ...confirmation });
    }
  });

  return Response.json({
    ok: true,
    reference: booking.reference,
    counsellor: { slug: booking.counsellor, name: counsellor?.name ?? booking.counsellor },
    start: booking.starts_at,
    end: booking.ends_at,
    mode: b.mode,
  });
}

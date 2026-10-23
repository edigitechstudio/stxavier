import 'server-only';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { EventCardData } from '@/components/trust/event-card';
import { getEvents, getNowIso } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import type { SiteEvent } from '@/types/trust';

const TZ = 'Asia/Kathmandu';

/** Events split into upcoming (soonest first) and past (latest first). */
export async function getEventBuckets(kind?: SiteEvent['kind']) {
  const [events, now] = await Promise.all([getEvents(), getNowIso()]);
  const list = kind ? events.filter((e) => e.kind === kind) : events;
  const isPast = (e: SiteEvent) => Date.parse(e.ends_at ?? e.starts_at) < Date.parse(now);
  return {
    upcoming: list.filter((e) => !isPast(e)),
    past: list.filter(isPast).reverse(),
    isPast,
  };
}

export async function toEventCards(events: SiteEvent[], isPast: (e: SiteEvent) => boolean, locale: string): Promise<EventCardData[]> {
  const [t, format] = await Promise.all([getTranslations('trust.events'), getFormatter()]);
  return events.map((e) => {
    const start = new Date(e.starts_at);
    const past = isPast(e);
    return {
      slug: e.slug,
      kindLabel: t(`kinds.${e.kind}`),
      title: l(e.title, locale) ?? e.slug,
      summary: l(e.summary, locale) ?? '',
      day: format.dateTime(start, { day: 'numeric', timeZone: TZ }),
      month: format.dateTime(start, { month: 'short', timeZone: TZ }),
      time: `${format.dateTime(start, { weekday: 'short', dateStyle: undefined, timeZone: TZ })} · ${format.dateTime(start, { hour: 'numeric', minute: '2-digit', timeZone: TZ })} NPT`,
      place: e.venue ? (l(e.venue, locale) ?? '') : t('online'),
      online: !e.venue,
      isPast: past,
      hasRecording: past && !!e.recording_url,
      isPlaceholder: e.is_placeholder,
      cta: past ? (e.recording_url ? t('watch') : t('details')) : t('register'),
    };
  });
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarPlus, Clock, MapPin, Users, Video } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { CtaBanner } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { InlineLeadForm } from '@/components/sx/counselling';
import { PageHero } from '@/components/sx/page-hero';
import { googleCalendarTimedUrl } from '@/lib/calc/timeline';
import { getEvent, getEvents, getHomeContent, getNowIso } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { eventSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';

const TZ = 'Asia/Kathmandu';

export async function generateStaticParams() {
  const events = await getEvents();
  return events.length ? events.map((e) => ({ slug: e.slug })) : [{ slug: 'none' }];
}

export async function generateMetadata({ params }: PageProps<'/[locale]/events/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [locale, e] = await Promise.all([currentLocale(), getEvent(slug)]);
  if (!e) return {};
  return pageMetadata({ locale, path: `/events/${e.slug}`, title: l(e.title, locale) ?? e.slug, description: (l(e.summary, locale) ?? '').slice(0, 155), image: e.image ?? undefined, noindex: e.is_placeholder });
}

export default async function EventPage({ params }: PageProps<'/[locale]/events/[slug]'>) {
  const { slug } = await params;
  const locale = await currentLocale();
  const [e, now, home, t, tm, format] = await Promise.all([getEvent(slug), getNowIso(), getHomeContent(), getTranslations('trust.events'), getTranslations('meta'), getFormatter()]);
  if (!e) notFound();

  const title = l(e.title, locale) ?? e.slug;
  const past = Date.parse(e.ends_at ?? e.starts_at) < Date.parse(now);
  const when = `${format.dateTime(new Date(e.starts_at), { dateStyle: 'full', timeZone: TZ })} · ${format.dateTime(new Date(e.starts_at), { hour: 'numeric', minute: '2-digit', timeZone: TZ })}${e.ends_at ? `–${format.dateTime(new Date(e.ends_at), { hour: 'numeric', minute: '2-digit', timeZone: TZ })}` : ''} NPT`;
  const where = e.venue ? (l(e.venue, locale) ?? '') : t('online');
  const url = absoluteUrl(locale, `/events/${e.slug}`);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbEvents'), href: '/events' }, { label: title, href: `/events/${e.slug}` }]}
        eyebrow={t(`kinds.${e.kind}`)}
        title={title}
        subtitle={l(e.summary, locale)}
        image={e.image}
      />
      <div className="wrap page-body">
        <div className="content-layout">
          <article>
            {e.is_placeholder && <p className="draft-banner">TODO — sample event, hidden in production.</p>}
            <div className="tile-grid">
              <div className="tile"><h3 className="flex items-center gap-2"><Clock size={18} aria-hidden /> {t('when')}</h3><p>{when}</p></div>
              <div className="tile"><h3 className="flex items-center gap-2">{e.venue ? <MapPin size={18} aria-hidden /> : <Video size={18} aria-hidden />} {t('where')}</h3><p>{where}</p></div>
            </div>
            <div className="block grid gap-3">
              {e.description.map((p, i) => <p key={i}>{l(p, locale)}</p>)}
              {e.capacity && <p className="inline-flex items-center gap-2 text-sm muted"><Users size={15} aria-hidden /> {t('seats', { n: e.capacity })}</p>}
            </div>
            {past && e.recording_url && (
              <section className="block" aria-labelledby="rec-title">
                <h2 id="rec-title">{t('watch')}</h2>
                <video className="w-full rounded-[18px] bg-black" src={e.recording_url} poster={e.image ?? undefined} controls preload="none" playsInline />
              </section>
            )}
          </article>
          <aside className="sticky-aside">
            {past ? (
              <p className="note-card">{t('ended')}</p>
            ) : (
              <>
                <section className="form-card" aria-labelledby="rsvp-title">
                  <InlineLeadForm
                    source="event_rsvp"
                    showDestination={false}
                    submitLabel={t('register')}
                    answers={{ event: e.slug }}
                    header={
                      <>
                        <h2 id="rsvp-title" className="text-xl font-extrabold">{t('registerTitle')}</h2>
                        <p className="muted text-sm">{t('registerIntro')}</p>
                      </>
                    }
                  />
                </section>
                <a
                  className="btn btn-outline btn-sm"
                  href={googleCalendarTimedUrl({ title, description: `${l(e.summary, locale) ?? ''}\n${url}`, start: e.starts_at, end: e.ends_at, location: where })}
                  target="_blank"
                  rel="noopener"
                >
                  <CalendarPlus size={16} aria-hidden /> {t('calendar')}
                </a>
              </>
            )}
          </aside>
        </div>
      </div>
      <CtaBanner home={home} locale={locale} />
      <JsonLd
        data={eventSchema({
          name: title,
          description: l(e.summary, locale) ?? '',
          url,
          startDate: e.starts_at,
          endDate: e.ends_at ?? undefined,
          online: !e.venue,
          venue: e.venue ? (l(e.venue, 'en') ?? undefined) : undefined,
          image: e.image ?? undefined,
        })}
      />
    </>
  );
}

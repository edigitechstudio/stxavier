import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CtaBanner } from '@/components/home/feature-sections';
import { PageHero } from '@/components/sx/page-hero';
import { EventCard } from '@/components/trust/event-card';
import { getHomeContent } from '@/lib/content';
import { getEventBuckets, toEventCards } from '@/lib/events-view';
import { currentLocale } from '@/lib/i18n/locale';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/webinars', title: t('webinars'), description: t('webinarsDesc') });
}

export default async function WebinarsPage() {
  const locale = await currentLocale();
  const [{ upcoming, past, isPast }, home, t, tm] = await Promise.all([getEventBuckets('webinar'), getHomeContent(), getTranslations('trust.events'), getTranslations('meta')]);
  const [up, done] = await Promise.all([toEventCards(upcoming, isPast, locale), toEventCards(past, isPast, locale)]);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbEvents'), href: '/events' }, { label: tm('crumbWebinars'), href: '/webinars' }]}
        title={tm('webinars')}
        highlight={tm('webinars').split(' ').slice(-1)[0]}
        subtitle={tm('webinarsDesc')}
      />
      <div className="wrap page-body">
        <section aria-labelledby="up-title">
          <h2 id="up-title" className="section-title mb-6">{t('upcoming')}</h2>
          {up.length ? <div className="event-list">{up.map((e) => <EventCard key={e.slug} e={e} />)}</div> : <p className="answer">{t('none')}</p>}
        </section>
        {done.length > 0 && (
          <section className="block" aria-labelledby="past-title">
            <h2 id="past-title">{t('past')}</h2>
            <div className="event-list">{done.map((e) => <EventCard key={e.slug} e={e} />)}</div>
          </section>
        )}
      </div>
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CtaBanner } from '@/components/home/feature-sections';
import { PageHero } from '@/components/sx/page-hero';
import { GoogleReviewsSection } from '@/components/trust/google-reviews';
import { StoryReels, SuccessWall, type WallStory } from '@/components/trust/success-wall';
import { getDestinations, getHomeContent, getTestimonials } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/success-stories', title: t('successStories'), description: t('successStoriesDesc') });
}

export default async function SuccessStoriesPage() {
  const locale = await currentLocale();
  const [stories, destinations, home, t, tm] = await Promise.all([
    getTestimonials('story'),
    getDestinations(),
    getHomeContent(),
    getTranslations('trust.stories'),
    getTranslations('meta'),
  ]);

  const wall: WallStory[] = stories.map((s) => {
    const d = destinations.find((x) => x.slug === s.destination);
    return {
      id: s.id,
      name: s.name,
      university: s.university ?? l(s.meta, locale) ?? '',
      destination: s.destination ?? null,
      countryName: d ? (l(d.name, locale) ?? d.slug) : (s.country ?? ''),
      iso2: d?.iso2 ?? null,
      intake: s.intake ?? null,
      image: s.image,
      quote: l(s.quote, locale) ?? '',
      story: l(s.story, locale) ?? '',
      video: s.video_url,
      isPlaceholder: s.is_placeholder,
    };
  });

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbStories'), href: '/success-stories' }]}
        eyebrow={t('wall')}
        title={tm('successStories')}
        highlight={tm('successStories').split(' ').slice(-2).join(' ')}
        subtitle={tm('successStoriesDesc')}
      />
      <div className="wrap page-body">
        {wall.some((s) => s.video) && (
          <section className="mb-14" aria-labelledby="reels-title">
            <h2 id="reels-title" className="section-title mb-6">{t('reels')}</h2>
            <StoryReels stories={wall} />
          </section>
        )}
        <SuccessWall stories={wall} />
      </div>
      <GoogleReviewsSection locale={locale} />
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CtaBanner } from '@/components/home/feature-sections';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { CounsellorCard } from '@/components/team/counsellor-card';
import { getCounsellors, getHomeContent, getPageContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/team', title: t('team'), description: t('teamDesc') });
}

export default async function TeamPage() {
  const locale = await currentLocale();
  const [page, home, team, t, tm] = await Promise.all([
    getPageContent('team'),
    getHomeContent(),
    getCounsellors(),
    getTranslations('pages'),
    getTranslations('meta'),
  ]);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbTeam'), href: '/team' }]}
        eyebrow={l(page.eyebrow, locale)}
        title={l(page.title, locale) ?? ''}
        highlight={l(page.highlight, locale)}
        subtitle={l(page.subtitle, locale)}
        image={page.image}
      />
      <div className="wrap page-body">
        {team.length ? (
          <div className="card-grid cols-4">
            {team.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 4) * 80}>
                <CounsellorCard
                  c={c}
                  locale={locale}
                  labels={{ experience: t.raw('experience'), book: t.raw('book'), viewProfile: t('viewProfile') }}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="answer">{t('noTeam')}</p>
        )}
      </div>
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

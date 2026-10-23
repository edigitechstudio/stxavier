import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DynamicIcon } from '@/components/icons';
import { CtaBanner } from '@/components/home/feature-sections';
import { CounsellingButton } from '@/components/sx/counselling';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { Link } from '@/i18n/navigation';
import { getHomeContent, getService, getServices } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/services/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [locale, s] = await Promise.all([currentLocale(), getService(slug)]);
  if (!s) return {};
  return pageMetadata({
    locale,
    path: `/services/${s.slug}`,
    title: l(s.title, locale) ?? s.slug,
    description: (l(s.details?.intro, locale) ?? l(s.summary, locale) ?? '').slice(0, 155),
  });
}

export default async function ServicePage({ params }: PageProps<'/[locale]/services/[slug]'>) {
  const { slug } = await params;
  const locale = await currentLocale();
  const [s, all, home, t, tm, th] = await Promise.all([
    getService(slug),
    getServices(),
    getHomeContent(),
    getTranslations('pages'),
    getTranslations('meta'),
    getTranslations('header'),
  ]);
  if (!s) notFound();
  const title = l(s.title, locale) ?? s.slug;
  const others = all.filter((x) => x.slug !== s.slug);

  return (
    <>
      <PageHero crumbs={[{ label: tm('crumbServices'), href: '/services' }, { label: title, href: `/services/${s.slug}` }]} title={title} subtitle={l(s.summary, locale)}>
        <div className="page-hero-actions">
          <CounsellingButton className="btn btn-accent">
            {th('bookCounselling')} <ArrowRight size={16} aria-hidden />
          </CounsellingButton>
        </div>
      </PageHero>
      <div className="wrap page-body">
        <div className="content-layout">
          <article>
            {s.details && (
              <>
                <p className="answer" data-speakable>{l(s.details.intro, locale)}</p>
                <section className="block" aria-labelledby="what-title">
                  <h2 id="what-title">{t('whatWeDo')}</h2>
                  <div className="tile-grid">
                    {s.details.points.map((p, i) => (
                      <Reveal key={i} className="tile" delay={(i % 2) * 80}>
                        <h3>{l(p.title, locale)}</h3>
                        <p>{l(p.text, locale)}</p>
                      </Reveal>
                    ))}
                  </div>
                </section>
              </>
            )}
          </article>
          <aside className="sticky-aside">
            <nav className="toc" aria-label={t('allServices')}>
              <strong>{t('allServices')}</strong>
              <ol>
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/services/${o.slug}`} className="flex items-center gap-2">
                      <DynamicIcon name={o.icon} className="size-4" /> {l(o.title, locale)}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>
      </div>
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

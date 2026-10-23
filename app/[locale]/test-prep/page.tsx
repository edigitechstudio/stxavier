import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DynamicIcon } from '@/components/icons';
import { CtaBanner } from '@/components/home/feature-sections';
import { FaqBlock } from '@/components/sx/faq-section';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { Link } from '@/i18n/navigation';
import { getFaqs, getHomeContent, getPageContent, getTestPrepCourses } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/test-prep', title: t('testPrep'), description: t('testPrepDesc') });
}

export default async function TestPrepPage() {
  const locale = await currentLocale();
  const [page, home, courses, faqs, t, tm, tCommon] = await Promise.all([
    getPageContent('test-prep'),
    getHomeContent(),
    getTestPrepCourses(),
    getFaqs('test-prep'),
    getTranslations('pages'),
    getTranslations('meta'),
    getTranslations('common'),
  ]);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbTestPrep'), href: '/test-prep' }]}
        eyebrow={l(page.eyebrow, locale)}
        title={l(page.title, locale) ?? ''}
        highlight={l(page.highlight, locale)}
        subtitle={l(page.subtitle, locale)}
        image={page.image}
      />
      <div className="wrap page-body">
        <div className="services-grid">
          {courses.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 4) * 90} className="service-card">
              <div className="service-icon"><DynamicIcon name={c.icon} className="size-[26px]" /></div>
              <h2 className="text-xl font-extrabold">{l(c.name, locale)}</h2>
              <p>{l(c.summary, locale)}</p>
              {c.details && (
                <p className="team-meta">
                  {t('courseDuration')}: {l(c.details.duration, locale)} · {t(`modes.${c.details.mode}`)}
                </p>
              )}
              <Link href={`/test-prep/${c.slug}`} className="link-arrow">
                {tCommon('learnMore')} <ArrowRight size={16} aria-hidden />
                <span className="sr-only">: {l(c.name, locale)}</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <FaqBlock id="faq" faqs={faqs} locale={locale} />
      </div>
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

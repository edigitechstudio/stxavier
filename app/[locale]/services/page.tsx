import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CtaBanner, Process } from '@/components/home/feature-sections';
import { Services } from '@/components/home/intro-services';
import { PageHero } from '@/components/sx/page-hero';
import { getFeatures, getHomeContent, getPageContent, getServices } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/services', title: t('services'), description: t('servicesDesc') });
}

export default async function ServicesPage() {
  const locale = await currentLocale();
  const [page, home, services, process, tm, tCommon] = await Promise.all([
    getPageContent('services'),
    getHomeContent(),
    getServices(),
    getFeatures('process'),
    getTranslations('meta'),
    getTranslations('common'),
  ]);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbServices'), href: '/services' }]}
        eyebrow={l(page.eyebrow, locale)}
        title={l(page.title, locale) ?? ''}
        highlight={l(page.highlight, locale)}
        subtitle={l(page.subtitle, locale)}
        image={page.image}
      />
      <Services home={home} services={services} locale={locale} learnMore={tCommon('learnMore')} hideHeading />
      <Process heading={home.process} items={process} locale={locale} />
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

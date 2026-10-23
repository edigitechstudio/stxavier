import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnquiryWizard } from '@/components/booking/enquiry-wizard';
import { PageHero } from '@/components/sx/page-hero';
import { getDestinations, getHomeContent, getPageContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';
import type { Localized } from '@/types/content';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/enquiry', title: t('enquiry'), description: t('enquiryDesc') });
}

export default async function EnquiryPage() {
  const locale = await currentLocale();
  const [page, destinations, home, tm] = await Promise.all([getPageContent('enquiry'), getDestinations(), getHomeContent(), getTranslations('meta')]);
  const opt = (o: { value: string; label: Localized }) => ({ value: o.value, label: l(o.label, locale) ?? o.value });

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbEnquiry'), href: '/enquiry' }]}
        eyebrow={l(page.hero.eyebrow, locale)}
        title={l(page.hero.title, locale) ?? ''}
        highlight={l(page.hero.highlight, locale)}
        subtitle={l(page.hero.subtitle, locale)}
        image={page.hero.image}
      />
      <div className="wrap page-body">
        <EnquiryWizard
          needs={page.needs.map(opt)}
          levels={page.levels.map(opt)}
          destinations={destinations.map((d) => ({ value: d.slug, label: l(d.name, locale) ?? d.slug }))}
          intakes={home.search.intakes.map((i) => l(i, locale) ?? i.en)}
        />
      </div>
    </>
  );
}

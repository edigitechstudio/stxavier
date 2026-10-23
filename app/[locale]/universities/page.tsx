import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CtaBanner } from '@/components/home/feature-sections';
import { PageHero } from '@/components/sx/page-hero';
import { UniversityDirectory } from '@/components/trust/university-directory';
import { getDestinations, getHomeContent, getPageContent, getUniversities } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { getExchangeRates } from '@/lib/rates';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/universities', title: t('universities'), description: t('universitiesDesc') });
}

export default async function UniversitiesPage() {
  const locale = await currentLocale();
  const [universities, destinations, config, rates, home, tm] = await Promise.all([
    getUniversities(),
    getDestinations(),
    getPageContent('tools'),
    getExchangeRates(),
    getHomeContent(),
    getTranslations('meta'),
  ]);
  const dest = (slug: string) => destinations.find((d) => d.slug === slug);
  const npr = (amount: number | null, currency: string) => (amount == null || !rates.rates[currency] ? null : Math.round(amount * rates.rates[currency]));

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbUniversities'), href: '/universities' }]}
        title={tm('universities')}
        highlight={tm('universities').split(' ').slice(-1)[0]}
        subtitle={tm('universitiesDesc')}
      />
      <div className="wrap page-body">
        <UniversityDirectory
          universities={universities.map((u) => ({
            slug: u.slug,
            name: u.name,
            country: u.country,
            countryName: l(dest(u.country)?.name, locale) ?? u.country,
            iso2: dest(u.country)?.iso2 ?? 'UN',
            city: u.city,
            logo: u.logo,
            ranking: u.ranking,
            rankingSource: u.ranking_source,
            feeNprMin: npr(u.fee_min, u.currency),
            feeNprMax: npr(u.fee_max, u.currency),
            intakes: u.intakes,
            fields: u.fields,
            courses: u.popular_courses.map((c) => l(c, locale) ?? ''),
            isPartner: u.is_partner,
          }))}
          countries={destinations.map((d) => ({ value: d.slug, label: l(d.name, locale) ?? d.slug }))}
          fields={config.fields.map((f) => ({ value: f.key, label: l(f.label, locale) ?? f.key }))}
        />
      </div>
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

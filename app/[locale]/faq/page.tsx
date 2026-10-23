import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CtaBanner } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/sx/page-hero';
import { FaqHub, type FaqGroup } from '@/components/trust/faq-hub';
import { getDestinations, getFaqs, getHomeContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { faqSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import type { Faq } from '@/types/content';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/faq', title: t('faq'), description: t('faqDesc') });
}

const GROUP_OF = (scope: string) =>
  scope === 'home' || scope === 'general' || scope === 'destinations'
    ? 'general'
    : scope.startsWith('destination:')
      ? 'destinations'
      : scope === 'parents'
        ? 'parents'
        : scope.startsWith('test-prep')
          ? 'test-prep'
          : scope.startsWith('tool:')
            ? 'tools'
            : 'other';
const ORDER = ['general', 'destinations', 'parents', 'test-prep', 'tools', 'other'] as const;

export default async function FaqPage() {
  const locale = await currentLocale();
  const [faqs, destinations, home, t, tp, tm] = await Promise.all([
    getFaqs(),
    getDestinations(),
    getHomeContent(),
    getTranslations('trust.faq'),
    getTranslations('pages'),
    getTranslations('meta'),
  ]);

  // Each country's answer-first sections double as FAQs, so the hub covers every destination.
  const countryFaqs: Faq[] = destinations.flatMap((d) => {
    if (!d.details) return [];
    const name = l(d.name, locale) ?? d.slug;
    return [
      { id: `${d.slug}-cost`, scope: `destination:${d.slug}`, sort: 0, published: true, question: { en: tp('cost', { country: name }) }, answer: d.details.costs.answer },
      { id: `${d.slug}-visa`, scope: `destination:${d.slug}`, sort: 1, published: true, question: { en: tp('visa', { country: name }) }, answer: d.details.visa.answer },
      { id: `${d.slug}-work`, scope: `destination:${d.slug}`, sort: 2, published: true, question: { en: tp('work', { country: name }) }, answer: d.details.work },
    ];
  });
  const all = [...faqs, ...countryFaqs];

  const groups: FaqGroup[] = ORDER.map((key) => ({
    key,
    title: t(`groups.${key}`),
    items: all.filter((f) => GROUP_OF(f.scope) === key).map((f) => ({ id: f.id, question: l(f.question, locale) ?? '', answer: l(f.answer, locale) ?? '' })),
  })).filter((g) => g.items.length);

  return (
    <>
      <PageHero crumbs={[{ label: tm('crumbFaq'), href: '/faq' }]} title={tm('faq')} highlight="FAQs" subtitle={tm('faqDesc')} />
      <div className="wrap page-body">
        <FaqHub groups={groups} />
      </div>
      <CtaBanner home={home} locale={locale} />
      <JsonLd data={faqSchema(all, locale)} />
    </>
  );
}

import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Flag } from '@/components/brand/flag';
import { DestinationsMap } from '@/components/home/destinations-map';
import { CtaBanner } from '@/components/home/feature-sections';
import { FaqBlock } from '@/components/sx/faq-section';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';
import { getDestinations, getFaqs, getHomeContent, getPageContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/destinations', title: t('destinations'), description: t('destinationsDesc') });
}

export default async function DestinationsPage() {
  const locale = await currentLocale();
  const [page, home, destinations, faqs, t, th, tm, tCommon] = await Promise.all([
    getPageContent('destinations'),
    getHomeContent(),
    getDestinations(),
    getFaqs('destinations'),
    getTranslations('pages'),
    getTranslations('home'),
    getTranslations('meta'),
    getTranslations('common'),
  ]);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbDestinations'), href: '/destinations' }]}
        eyebrow={l(page.eyebrow, locale)}
        title={l(page.title, locale) ?? ''}
        highlight={l(page.highlight, locale)}
        subtitle={l(page.subtitle, locale)}
        image={page.image}
      />

      <section className="destinations" aria-labelledby="dest-map-title">
        <div className="wrap">
          <h2 id="dest-map-title" className="sr-only">{th('destinationsList')}</h2>
          <DestinationsMap
            labels={{ studyIn: th.raw('studyIn'), learnMore: tCommon('learnMore'), list: th('destinationsList') }}
            destinations={destinations.map((d) => ({
              slug: d.slug,
              iso2: d.iso2,
              iso3: d.iso3,
              name: l(d.name, locale) ?? d.slug,
              summary: l(d.summary, locale) ?? '',
              image: d.hero_image,
              badge: l(d.badge, locale) ?? null,
              lat: d.lat,
              lng: d.lng,
            }))}
          />
        </div>
      </section>

      <div className="wrap page-body">
        <div className="card-grid">
          {destinations.map((d, i) => (
            <Reveal key={d.slug} delay={(i % 3) * 80}>
              <Link href={`/study-in/${d.slug}`} className="dest-tile h-full">
                <div className="dest-tile-img">
                  <SmartImage src={d.hero_image ?? ''} alt="" fill sizes="(max-width: 760px) 100vw, 380px" />
                  <span className="dest-flag"><Flag code={d.iso2} className="h-5 w-7" /></span>
                  {d.badge && <span className="dest-badge">{l(d.badge, locale)}</span>}
                </div>
                <div className="dest-tile-body">
                  <h2 className="text-xl font-extrabold">{th('studyIn', { country: l(d.name, locale) ?? d.slug })}</h2>
                  <p>{l(d.summary, locale)}</p>
                  <span className="link-arrow">{t('viewGuide')} <ArrowRight size={16} aria-hidden /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <section className="block" aria-labelledby="compare-title">
          <h2 id="compare-title">{t('compareTitle')}</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t('country')}</th>
                  <th scope="col">{t('intakes')}</th>
                  <th scope="col">{t('workRights')}</th>
                  <th scope="col"><span className="sr-only">{t('viewGuide')}</span></th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((d) => (
                  <tr key={d.slug}>
                    <th scope="row">
                      <span className="inline-flex items-center gap-2"><Flag code={d.iso2} /> {l(d.name, locale)}</span>
                    </th>
                    <td>{l(d.key_facts.intakes, locale) ?? '—'}</td>
                    <td>{l(d.key_facts.work_rights, locale) ?? '—'}</td>
                    <td><Link href={`/study-in/${d.slug}`}>{t('viewGuide')} →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <FaqBlock id="faq" faqs={faqs} locale={locale} />
      </div>

      <CtaBanner home={home} locale={locale} />
    </>
  );
}

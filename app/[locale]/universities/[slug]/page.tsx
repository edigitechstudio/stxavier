import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Flag } from '@/components/brand/flag';
import { CtaBanner } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { InlineLeadForm } from '@/components/sx/counselling';
import { PageHero } from '@/components/sx/page-hero';
import { Link } from '@/i18n/navigation';
import { getDestinations, getHomeContent, getPageContent, getUniversities, getUniversity } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { getExchangeRates } from '@/lib/rates';
import { universitySchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';

export async function generateStaticParams() {
  const universities = await getUniversities();
  return universities.length ? universities.map((u) => ({ slug: u.slug })) : [{ slug: 'none' }];
}

export async function generateMetadata({ params }: PageProps<'/[locale]/universities/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [locale, u] = await Promise.all([currentLocale(), getUniversity(slug)]);
  if (!u) return {};
  return pageMetadata({ locale, path: `/universities/${u.slug}`, title: `${u.name}, ${u.city}`, description: (l(u.description, locale) ?? '').slice(0, 155) });
}

export default async function UniversityPage({ params }: PageProps<'/[locale]/universities/[slug]'>) {
  const { slug } = await params;
  const locale = await currentLocale();
  const [u, destinations, config, rates, home, t, tm, format] = await Promise.all([
    getUniversity(slug),
    getDestinations(),
    getPageContent('tools'),
    getExchangeRates(),
    getHomeContent(),
    getTranslations('trust.universities'),
    getTranslations('meta'),
    getFormatter(),
  ]);
  if (!u) notFound();

  const d = destinations.find((x) => x.slug === u.country);
  const countryName = l(d?.name, locale) ?? u.country;
  const rate = rates.rates[u.currency];
  const money = (n: number) => format.number(n, { style: 'currency', currency: u.currency, maximumFractionDigits: 0 });
  const npr = (n: number) => `NPR ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n * rate))}`;
  const month = (m: number) => format.dateTime(new Date(Date.UTC(2026, m - 1, 1)), { month: 'long', timeZone: 'UTC' });
  const fieldLabels = u.fields.map((f) => l(config.fields.find((x) => x.key === f)?.label, locale) ?? f);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbUniversities'), href: '/universities' }, { label: u.name, href: `/universities/${u.slug}` }]}
        title={u.name}
        subtitle={`${u.city}, ${countryName}`}
      >
        {d && (
          <div className="page-hero-actions">
            <Link href={`/study-in/${d.slug}`} className="btn btn-glass btn-sm"><Flag code={d.iso2} /> {tm('studyIn', { country: countryName })}</Link>
          </div>
        )}
      </PageHero>

      <div className="wrap page-body">
        <div className="content-layout">
          <article>
            <section className="block" aria-labelledby="about-title">
              <h2 id="about-title">{t('about', { name: u.name })}</h2>
              <p className="answer">{l(u.description, locale)}</p>
            </section>
            <section className="block" aria-labelledby="courses-title">
              <h2 id="courses-title">{t('courses')}</h2>
              <ul className="pill-list">{u.popular_courses.map((c, i) => <li key={i}>{l(c, locale)}</li>)}</ul>
            </section>
            <section className="block" aria-labelledby="fields-title">
              <h2 id="fields-title">{t('fieldsLabel')}</h2>
              <ul className="pill-list">{fieldLabels.map((f) => <li key={f}>{f}</li>)}</ul>
            </section>
          </article>

          <aside className="sticky-aside">
            <div className="facts-card">
              <h2>{u.name}</h2>
              <dl>
                <div><dt>{t('location')}</dt><dd>{u.city}, {countryName}</dd></div>
                <div><dt>{t('ranking')}</dt><dd>{u.ranking ? `#${u.ranking}${u.ranking_source ? ` (${u.ranking_source})` : ''}` : t('notRanked')}</dd></div>
                {u.fee_min != null && u.fee_max != null && (
                  <div>
                    <dt>{t('tuition')}</dt>
                    <dd>{money(u.fee_min)} – {money(u.fee_max)}{rate ? <><br />≈ {npr(u.fee_min)} – {npr(u.fee_max)}</> : null}</dd>
                  </div>
                )}
                <div><dt>{t('intakes')}</dt><dd>{u.intakes.map(month).join(', ')}</dd></div>
              </dl>
              {u.website && (
                <a href={u.website} target="_blank" rel="noopener" className="btn btn-white btn-sm">{t('website')} <ExternalLink size={14} aria-hidden /></a>
              )}
            </div>
            <section className="form-card" aria-labelledby="uni-form">
              <InlineLeadForm
                source="enquiry"
                prefill={{ destination: countryName }}
                answers={{ university: u.name }}
                header={<h2 id="uni-form" className="text-xl font-extrabold">{t('enquire', { name: u.name })}</h2>}
              />
            </section>
            <p className="tool-note">{t('tuitionNote')}</p>
          </aside>
        </div>
      </div>
      <CtaBanner home={home} locale={locale} />
      <JsonLd
        data={universitySchema({
          name: u.name,
          url: absoluteUrl(locale, `/universities/${u.slug}`),
          city: u.city,
          country: countryName,
          website: u.website,
          description: l(u.description, locale),
        })}
      />
    </>
  );
}

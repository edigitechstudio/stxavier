import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, Building2, CheckCircle2, Info, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Flag } from '@/components/brand/flag';
import { CtaBanner } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { LastUpdated } from '@/components/seo/last-updated';
import { SourceList } from '@/components/seo/source-citation';
import { CounsellingButton } from '@/components/sx/counselling';
import { FaqBlock } from '@/components/sx/faq-section';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';
import { getDestination, getDestinations, getFaqs, getHomeContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { howToSchema, speakableWebPageSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';
import type { Destination, Faq, KeyFacts, Locale, Localized } from '@/types/content';

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map((d) => ({ country: d.slug }));
}

const clip = (s: string, n = 155) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const weeks = (iso: string | null) => (iso ? Number(/P(\d+)W/.exec(iso)?.[1] ?? 0) || null : null);

export async function generateMetadata({ params }: PageProps<'/[locale]/study-in/[country]'>): Promise<Metadata> {
  const { country } = await params;
  const [locale, d, t] = await Promise.all([currentLocale(), getDestination(country), getTranslations('meta')]);
  if (!d) return {};
  const name = l(d.name, locale) ?? d.slug;
  return pageMetadata({
    locale,
    path: `/study-in/${d.slug}`,
    title: t('studyIn', { country: name }),
    description: clip(l(d.details?.intro, locale) ?? l(d.summary, locale) ?? ''),
    image: d.hero_image ?? undefined,
  });
}

/** Auto-FAQ from the page's own answer-first sections + any extra FAQs scoped to this country. */
function buildFaqs(d: Destination, q: { cost: string; visa: string; work: string }, extra: Faq[]): Faq[] {
  const det = d.details;
  const auto: Faq[] = det
    ? [
        { id: `${d.slug}-cost`, scope: '', sort: 0, published: true, question: { en: q.cost }, answer: det.costs.answer },
        { id: `${d.slug}-visa`, scope: '', sort: 1, published: true, question: { en: q.visa }, answer: det.visa.answer },
        { id: `${d.slug}-work`, scope: '', sort: 2, published: true, question: { en: q.work }, answer: det.work },
      ]
    : [];
  return [...auto, ...extra];
}

const FACT_KEYS = [
  ['intakes', 'intakes'],
  ['avg_tuition', 'avgTuition'],
  ['living_cost', 'livingCost'],
  ['work_rights', 'workRights'],
  ['post_study_visa', 'postStudy'],
  ['visa_processing', 'processing'],
] as const satisfies readonly (readonly [keyof KeyFacts, string])[];

export default async function CountryPage({ params }: PageProps<'/[locale]/study-in/[country]'>) {
  const { country } = await params;
  const locale: Locale = await currentLocale();
  const [d, all, t, tm, tCommon, home, scopedFaqs] = await Promise.all([
    getDestination(country),
    getDestinations(),
    getTranslations('pages'),
    getTranslations('meta'),
    getTranslations('common'),
    getHomeContent(),
    getFaqs(`destination:${country}`),
  ]);
  if (!d) notFound();

  const name = l(d.name, locale) ?? d.slug;
  const det = d.details;
  const loc = (v: Localized | null | undefined) => l(v, locale);
  const facts = FACT_KEYS.map(([key, label]) => [t(label), loc(d.key_facts[key])] as const).filter(([, v]) => v);
  const faqs = buildFaqs(d, { cost: t('cost', { country: name }), visa: t('visa', { country: name }), work: t('work', { country: name }) }, scopedFaqs);
  const others = all.filter((x) => x.slug !== d.slug).slice(0, 3);
  const pageUrl = absoluteUrl(locale, `/study-in/${d.slug}`);

  const sections = det
    ? [
        ['why', t('why', { country: name })],
        ['cost', t('cost', { country: name })],
        ['courses', t('courses', { country: name })],
        ['universities', t('universities', { country: name })],
        ['scholarships', t('scholarships', { country: name })],
        ['visa', t('visa', { country: name })],
        ['documents', t('documents', { country: name })],
        ['work', t('work', { country: name })],
        ['life', t('life', { city: det.life.city })],
        ['faq', t('faq', { country: name })],
      ]
    : [];

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbDestinations'), href: '/destinations' }, { label: name, href: `/study-in/${d.slug}` }]}
        title={tm('studyIn', { country: name })}
        highlight={name}
        subtitle={loc(d.summary)}
        image={d.hero_image}
      >
        <div className="page-hero-actions">
          <span className="dest-flag" style={{ position: 'static' }}><Flag code={d.iso2} className="h-5 w-7" label={name} /></span>
          <CounsellingButton className="btn btn-accent" prefill={{ destination: name }}>
            {t('talk', { country: name })} <ArrowRight size={16} aria-hidden />
          </CounsellingButton>
        </div>
      </PageHero>

      <div className="wrap page-body">
        <div className="content-layout">
          <article>
            {det ? (
              <>
                <p className="answer" data-speakable>{loc(det.intro)}</p>
                <div className="meta-row">
                  <LastUpdated date={d.updated_at} />
                </div>

                <section className="block" id="why">
                  <h2>{sections[0][1]}</h2>
                  <div className="tile-grid">
                    {det.why.map((w, i) => (
                      <Reveal key={i} className="tile" delay={(i % 2) * 80}>
                        <h3>{loc(w.title)}</h3>
                        <p>{loc(w.text)}</p>
                      </Reveal>
                    ))}
                  </div>
                </section>

                <section className="block" id="cost">
                  <h2>{sections[1][1]}</h2>
                  <p className="block-lead" data-speakable>{loc(det.costs.answer)}</p>
                  <div className="two-tables">
                    <div className="table-wrap">
                      <table className="data-table">
                        <caption>{t('tuition')}</caption>
                        <thead><tr><th scope="col">{t('level')}</th><th scope="col">{t('range')}</th></tr></thead>
                        <tbody>
                          {det.costs.tuition.map((r, i) => (
                            <tr key={i}><th scope="row">{loc(r.level)}</th><td>{loc(r.range)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="table-wrap">
                      <table className="data-table">
                        <caption>{t('living')}</caption>
                        <thead><tr><th scope="col">{t('item')}</th><th scope="col">{t('amount')}</th></tr></thead>
                        <tbody>
                          {det.costs.living.map((r, i) => (
                            <tr key={i}><th scope="row">{loc(r.item)}</th><td>{loc(r.amount)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {det.costs.note && <p className="table-note">{loc(det.costs.note)}</p>}
                </section>

                <section className="block" id="courses">
                  <h2>{sections[2][1]}</h2>
                  <ul className="pill-list">
                    {det.courses.map((c, i) => <li key={i}>{loc(c)}</li>)}
                  </ul>
                </section>

                <section className="block" id="universities">
                  <h2>{sections[3][1]}</h2>
                  <ul className="uni-list">
                    {det.universities.map((u) => (
                      <li key={u.name}>
                        <Building2 size={20} aria-hidden />
                        <span>
                          <strong>{u.url ? <a href={u.url} target="_blank" rel="noopener">{u.name}</a> : u.name}</strong>
                          <span>{u.city}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="block" id="scholarships">
                  <h2>{sections[4][1]}</h2>
                  <div className="table-wrap">
                    <table className="data-table">
                      <tbody>
                        {det.scholarships.map((s) => (
                          <tr key={s.name}>
                            <th scope="row">{s.url ? <a href={s.url} target="_blank" rel="noopener">{s.name}</a> : s.name}</th>
                            <td>{loc(s.detail)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="block" id="visa">
                  <h2>{sections[5][1]}</h2>
                  <p className="block-lead" data-speakable>{loc(det.visa.answer)}</p>
                  <ol className="steps">
                    {det.visa.steps.map((s, i) => (
                      <li key={i}>
                        <h3>{loc(s.title)}</h3>
                        <p>{loc(s.text)}</p>
                      </li>
                    ))}
                  </ol>
                  {weeks(det.visa.total_time) && <p className="table-note">{t('typicalTime', { weeks: weeks(det.visa.total_time)! })}</p>}
                </section>

                <section className="block" id="documents">
                  <h2>{sections[6][1]}</h2>
                  <ul className="check-list">
                    {det.documents.map((doc, i) => (
                      <li key={i}><CheckCircle2 size={18} aria-hidden /> {loc(doc)}</li>
                    ))}
                  </ul>
                </section>

                <section className="block" id="work">
                  <h2>{sections[7][1]}</h2>
                  <p className="answer" data-speakable>{loc(det.work)}</p>
                </section>

                <section className="block" id="life">
                  <h2>{sections[8][1]}</h2>
                  <p>{loc(det.life.text)}</p>
                  {det.life.nepali_community && (
                    <div className="note-card mt-4">
                      <Users size={22} aria-hidden />
                      <p><strong>{t('nepaliCommunity')}:</strong> {loc(det.life.nepali_community)}</p>
                    </div>
                  )}
                </section>

                <FaqBlock id="faq" title={sections[9][1]} faqs={faqs} locale={locale} />
                <SourceList sources={det.sources} />
              </>
            ) : (
              <div className="note-card">
                <Info size={22} aria-hidden />
                <p>{t('guideComing', { country: name })}</p>
              </div>
            )}
          </article>

          <aside className="sticky-aside">
            {facts.length > 0 && (
              <div className="facts-card">
                <h2>{t('keyFacts')}</h2>
                <dl>
                  {facts.map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
                <CounsellingButton className="btn btn-accent" prefill={{ destination: name }}>
                  {t('talk', { country: name })}
                </CounsellingButton>
              </div>
            )}
            {sections.length > 0 && (
              <nav className="toc" aria-label={t('onThisPage')}>
                <strong>{t('onThisPage')}</strong>
                <ol>
                  {sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
                </ol>
              </nav>
            )}
          </aside>
        </div>

        {others.length > 0 && (
          <section className="block" aria-labelledby="others-title">
            <h2 id="others-title">{t('otherDestinations')}</h2>
            <div className="card-grid">
              {others.map((o) => (
                <Link key={o.slug} href={`/study-in/${o.slug}`} className="dest-tile">
                  <div className="dest-tile-img">
                    <SmartImage src={o.hero_image ?? ''} alt="" fill sizes="(max-width: 760px) 100vw, 380px" />
                    <span className="dest-flag"><Flag code={o.iso2} className="h-5 w-7" /></span>
                  </div>
                  <div className="dest-tile-body">
                    <h3>{l(o.name, locale)}</h3>
                    <p>{l(o.summary, locale)}</p>
                    <span className="link-arrow">{tCommon('learnMore')} <ArrowRight size={16} aria-hidden /></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <CtaBanner home={home} locale={locale} />

      {det && (
        <JsonLd
          data={[
            howToSchema({
              name: t('visa', { country: name }),
              description: loc(det.visa.answer),
              totalTime: det.visa.total_time ?? undefined,
              steps: det.visa.steps.map((s) => ({ name: loc(s.title) ?? '', text: loc(s.text) ?? '', url: `${pageUrl}#visa` })),
            }),
            speakableWebPageSchema({ name: tm('studyIn', { country: name }), url: pageUrl, dateModified: d.updated_at }),
          ]}
        />
      )}
    </>
  );
}

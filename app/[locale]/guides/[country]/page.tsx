import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, Globe, Mail, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Flag } from '@/components/brand/flag';
import { PrintButton } from '@/components/booking/print-button';
import { Link } from '@/i18n/navigation';
import { getDestination, getDestinations, getSiteSettings } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';
import type { KeyFacts, Localized } from '@/types/content';

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map((d) => ({ country: d.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/guides/[country]'>): Promise<Metadata> {
  const { country } = await params;
  const [locale, d, t] = await Promise.all([currentLocale(), getDestination(country), getTranslations('meta')]);
  if (!d) return {};
  const name = l(d.name, locale) ?? d.slug;
  // Printable copy of the country page. Keep it out of search to avoid duplicate content.
  return pageMetadata({ locale, path: `/guides/${d.slug}`, title: t('guide', { country: name }), description: l(d.summary, locale) ?? '', noindex: true });
}

const FACT_KEYS = [
  ['intakes', 'intakes'],
  ['avg_tuition', 'avgTuition'],
  ['living_cost', 'livingCost'],
  ['work_rights', 'workRights'],
  ['post_study_visa', 'postStudy'],
  ['visa_processing', 'processing'],
] as const satisfies readonly (readonly [keyof KeyFacts, string])[];

export default async function GuidePage({ params }: PageProps<'/[locale]/guides/[country]'>) {
  const { country } = await params;
  const locale = await currentLocale();
  const [d, site, t, tg, tm] = await Promise.all([getDestination(country), getSiteSettings(), getTranslations('pages'), getTranslations('guide'), getTranslations('meta')]);
  if (!d) notFound();

  const name = l(d.name, locale) ?? d.slug;
  const loc = (v: Localized | null | undefined) => l(v, locale);
  const det = d.details;
  const facts = FACT_KEYS.map(([key, label]) => [t(label), loc(d.key_facts[key])] as const).filter(([, v]) => v);
  const updated = new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-GB', { dateStyle: 'long' }).format(new Date(d.updated_at));

  return (
    <div className="wrap page-body">
      <article className="guide-doc">
        <header className="guide-head">
          <div className="guide-brand">
            <Image src="/brand/logo-mark.webp" alt="" width={56} height={30} />
            <span>
              <strong>{site.name}</strong>
              <small>{l(site.tagline, locale)}</small>
            </span>
          </div>
          <PrintButton label={tg('print')} />
        </header>

        <div className="guide-title">
          <Flag code={d.iso2} className="guide-flag" />
          <div>
            <h1>{tm('guide', { country: name })}</h1>
            <p>{tg('intro', { country: name })}</p>
            <small className="muted">{updated}</small>
          </div>
        </div>

        <p className="guide-lead">{loc(det?.intro) ?? loc(d.summary)}</p>

        {facts.length > 0 && (
          <section className="guide-section">
            <h2>{t('keyFacts')}</h2>
            <dl className="guide-facts">
              {facts.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </section>
        )}

        {det && (
          <>
            {det.why.length > 0 && (
              <section className="guide-section">
                <h2>{t('why', { country: name })}</h2>
                <ul className="guide-list">
                  {det.why.map((w) => <li key={w.title.en}><strong>{loc(w.title)}.</strong> {loc(w.text)}</li>)}
                </ul>
              </section>
            )}

            <section className="guide-section">
              <h2>{t('cost', { country: name })}</h2>
              <p>{loc(det.costs.answer)}</p>
              <div className="guide-two">
                <table className="guide-table">
                  <caption>{t('tuition')}</caption>
                  <thead><tr><th scope="col">{t('level')}</th><th scope="col">{t('range')}</th></tr></thead>
                  <tbody>{det.costs.tuition.map((r) => <tr key={r.level.en}><td>{loc(r.level)}</td><td>{loc(r.range)}</td></tr>)}</tbody>
                </table>
                <table className="guide-table">
                  <caption>{t('living')}</caption>
                  <thead><tr><th scope="col">{t('item')}</th><th scope="col">{t('amount')}</th></tr></thead>
                  <tbody>{det.costs.living.map((r) => <tr key={r.item.en}><td>{loc(r.item)}</td><td>{loc(r.amount)}</td></tr>)}</tbody>
                </table>
              </div>
              {det.costs.note && <p className="muted">{loc(det.costs.note)}</p>}
            </section>

            <section className="guide-section">
              <h2>{t('visa', { country: name })}</h2>
              <p>{loc(det.visa.answer)}</p>
              <ol className="guide-list is-numbered">
                {det.visa.steps.map((s) => <li key={s.title.en}><strong>{loc(s.title)}.</strong> {loc(s.text)}</li>)}
              </ol>
            </section>

            {det.documents.length > 0 && (
              <section className="guide-section">
                <h2>{t('documents', { country: name })}</h2>
                <ul className="guide-checklist">
                  {det.documents.map((doc) => <li key={doc.en}>{loc(doc)}</li>)}
                </ul>
              </section>
            )}

            <section className="guide-section">
              <h2>{t('work', { country: name })}</h2>
              <p>{loc(det.work)}</p>
            </section>

            {det.scholarships.length > 0 && (
              <section className="guide-section">
                <h2>{t('scholarships', { country: name })}</h2>
                <ul className="guide-list">
                  {det.scholarships.map((s) => <li key={s.name}><strong>{s.name}</strong>: {loc(s.detail)}</li>)}
                </ul>
              </section>
            )}

            {(det.courses.length > 0 || det.universities.length > 0) && (
              <section className="guide-section guide-two">
                {det.courses.length > 0 && (
                  <div>
                    <h2>{t('courses', { country: name })}</h2>
                    <ul className="guide-list">{det.courses.map((c) => <li key={c.en}>{loc(c)}</li>)}</ul>
                  </div>
                )}
                {det.universities.length > 0 && (
                  <div>
                    <h2>{t('universities', { country: name })}</h2>
                    <ul className="guide-list">{det.universities.map((u) => <li key={u.name}>{u.name} <span className="muted">({u.city})</span></li>)}</ul>
                  </div>
                )}
              </section>
            )}

            {det.sources.length > 0 && (
              <section className="guide-section guide-sources">
                <h2>{t('sources')}</h2>
                <ul>{det.sources.map((s) => <li key={s.url}>{s.label}: <span className="guide-url">{s.url}</span></li>)}</ul>
              </section>
            )}
          </>
        )}

        <footer className="guide-foot">
          <p><strong>{t('talk', { country: name })}</strong></p>
          <p className="guide-contact">
            <span><Phone size={15} aria-hidden /> {site.phone}</span>
            <span><Mail size={15} aria-hidden /> {site.email}</span>
            <span><Globe size={15} aria-hidden /> stxavier.com.np</span>
          </p>
          <Link href={`/study-in/${d.slug}`} className="link-arrow no-print">
            {tg('full')} <ArrowRight size={15} aria-hidden />
          </Link>
        </footer>
      </article>
    </div>
  );
}

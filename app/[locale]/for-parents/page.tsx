import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DynamicIcon } from '@/components/icons';
import { JsonLd } from '@/components/seo/json-ld';
import { InlineLeadForm } from '@/components/sx/counselling';
import { FaqBlock } from '@/components/sx/faq-section';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { getFaqs, getPageContent, getSiteSettings } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { speakableWebPageSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/for-parents', title: t('parents'), description: t('parentsDesc') });
}

export default async function ParentsPage() {
  const locale = await currentLocale();
  const [page, site, faqs, t, tm] = await Promise.all([
    getPageContent('for-parents'),
    getSiteSettings(),
    getFaqs('parents'),
    getTranslations('pages'),
    getTranslations('meta'),
  ]);
  const c = page.cost_example;

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbParents'), href: '/for-parents' }]}
        eyebrow={l(page.hero.eyebrow, locale)}
        title={l(page.hero.title, locale) ?? ''}
        highlight={l(page.hero.highlight, locale)}
        subtitle={l(page.hero.subtitle, locale)}
        image={page.hero.image}
      />

      <div className="wrap page-body">
        <div className="content-layout">
          <article>
            <p className="answer" data-speakable>{l(page.intro, locale)}</p>

            <section className="block" aria-label={tm('parents')}>
              <div className="tile-grid">
                {page.sections.map((s, i) => (
                  <Reveal key={i} className="tile" delay={(i % 2) * 80}>
                    <div className="tile-icon"><DynamicIcon name={s.icon} className="size-5" /></div>
                    <h2 className="text-lg font-extrabold">{l(s.title, locale)}</h2>
                    <p>{l(s.text, locale)}</p>
                  </Reveal>
                ))}
              </div>
            </section>

            <section className="block" aria-labelledby="cost-title">
              <h2 id="cost-title">{l(c.title, locale)}</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th scope="col">{t('item')}</th><th scope="col">{t('amount')}</th></tr></thead>
                  <tbody>
                    {c.rows.map((r, i) => (
                      <tr key={i}><th scope="row">{l(r.item, locale)}</th><td>{l(r.amount, locale)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="table-note">{l(c.note, locale)}</p>
            </section>

            <FaqBlock id="faq" faqs={faqs} locale={locale} />
          </article>

          <aside className="sticky-aside">
            <section className="form-card" aria-labelledby="parent-form-title">
              <InlineLeadForm
                source="parent"
                showMessage
                header={<h2 id="parent-form-title" className="text-xl font-extrabold">{l(page.form_title, locale)}</h2>}
              />
            </section>
          </aside>
        </div>
      </div>
      <JsonLd data={speakableWebPageSchema({ name: tm('parents'), url: absoluteUrl(locale, '/for-parents'), dateModified: site.updated_at })} />
    </>
  );
}

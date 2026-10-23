import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckCircle2, Info } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/seo/json-ld';
import { SourceList } from '@/components/seo/source-citation';
import { InlineLeadForm } from '@/components/sx/counselling';
import { FaqBlock } from '@/components/sx/faq-section';
import { PageHero } from '@/components/sx/page-hero';
import { Link } from '@/i18n/navigation';
import { getFaqs, getSiteSettings, getTestPrepCourse, getTestPrepCourses } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { courseSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';

export async function generateStaticParams() {
  const courses = await getTestPrepCourses();
  return courses.map((c) => ({ course: c.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/test-prep/[course]'>): Promise<Metadata> {
  const { course } = await params;
  const [locale, c, t] = await Promise.all([currentLocale(), getTestPrepCourse(course), getTranslations('meta')]);
  if (!c) return {};
  return pageMetadata({
    locale,
    path: `/test-prep/${c.slug}`,
    title: t('course', { course: l(c.name, locale) ?? c.slug }),
    description: (l(c.details?.overview, locale) ?? l(c.summary, locale) ?? '').slice(0, 155),
  });
}

export default async function CoursePage({ params }: PageProps<'/[locale]/test-prep/[course]'>) {
  const { course } = await params;
  const locale = await currentLocale();
  const [c, scoped, general, t, tm, site] = await Promise.all([
    getTestPrepCourse(course),
    getFaqs(`test-prep:${course}`),
    getFaqs('test-prep'),
    getTranslations('pages'),
    getTranslations('meta'),
    getSiteSettings(),
  ]);
  if (!c) notFound();
  const name = l(c.name, locale) ?? c.slug;
  const d = c.details;
  const url = absoluteUrl(locale, `/test-prep/${c.slug}`);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbTestPrep'), href: '/test-prep' }, { label: name, href: `/test-prep/${c.slug}` }]}
        title={tm('course', { course: name })}
        highlight={name}
        subtitle={l(c.summary, locale)}
      />
      <div className="wrap page-body">
        <div className="content-layout">
          <article>
            {d ? (
              <>
                <p className="answer" data-speakable>{l(d.overview, locale)}</p>

                <section className="block" aria-labelledby="format-title">
                  <h2 id="format-title">{t('format')}</h2>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th scope="col">{t('section')}</th><th scope="col">{t('duration')}</th><th scope="col">{t('details')}</th></tr></thead>
                      <tbody>
                        {d.format.map((f) => (
                          <tr key={f.section}>
                            <th scope="row">{f.section}</th>
                            <td>{f.duration === 'TODO' ? <span className="todo-badge">TODO</span> : f.duration}</td>
                            <td>{l(f.detail, locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="block" aria-labelledby="batches-title">
                  <h2 id="batches-title">{t('batches')}</h2>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th scope="col">{t('batch')}</th><th scope="col">{t('time')}</th><th scope="col">{t('days')}</th></tr></thead>
                      <tbody>
                        {d.batches.map((b, i) => (
                          <tr key={i}><th scope="row">{l(b.name, locale)}</th><td>{b.time}</td><td>{l(b.days, locale)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="block" aria-labelledby="features-title">
                  <h2 id="features-title">{t('features')}</h2>
                  <ul className="check-list">
                    {d.features.map((f, i) => <li key={i}><CheckCircle2 size={18} aria-hidden /> {l(f, locale)}</li>)}
                  </ul>
                </section>

                <FaqBlock id="faq" faqs={[...scoped, ...general]} locale={locale} />
                <SourceList sources={d.sources} />
              </>
            ) : (
              <div className="note-card"><Info size={22} aria-hidden /><p>{l(c.summary, locale)}</p></div>
            )}
          </article>

          <aside className="sticky-aside">
            {d && (
              <div className="facts-card">
                <h2>{t('courseInfo')}</h2>
                <dl>
                  <div><dt>{t('courseDuration')}</dt><dd>{l(d.duration, locale)}</dd></div>
                  <div><dt>{t('mode')}</dt><dd>{t(`modes.${d.mode}`)}</dd></div>
                  {d.fee && <div><dt>{t('fee')}</dt><dd>{l(d.fee, locale)}</dd></div>}
                </dl>
              </div>
            )}
            <section className="form-card" aria-labelledby="mock-title">
              <InlineLeadForm
                source="enquiry"
                showDestination={false}
                prefill={{ course: name }}
                submitLabel={t('freeMock')}
                header={<h2 id="mock-title" className="text-xl font-extrabold">{t('freeMock')}</h2>}
              />
            </section>
            <Link href="/test-prep" className="link-arrow">← {t('allCourses')}</Link>
          </aside>
        </div>
      </div>
      <JsonLd data={courseSchema({ name: tm('course', { course: name }), description: l(d?.overview ?? c.summary, locale) ?? '', url, providerName: site.name, mode: d?.mode })} />
    </>
  );
}

import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { CtaBanner, Edge } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { getAccreditations, getFeatures, getHomeContent, getPageContent, getSiteSettings, getStats } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { speakableWebPageSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/about', title: t('about'), description: t('aboutDesc') });
}

export default async function AboutPage() {
  const locale = await currentLocale();
  const [about, home, site, stats, edge, accreditations, t, tm, format] = await Promise.all([
    getPageContent('about'),
    getHomeContent(),
    getSiteSettings(),
    getStats(),
    getFeatures('edge'),
    getAccreditations(),
    getTranslations('pages'),
    getTranslations('meta'),
    getFormatter(),
  ]);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbAbout'), href: '/about' }]}
        eyebrow={l(about.hero.eyebrow, locale)}
        title={l(about.hero.title, locale) ?? ''}
        highlight={l(about.hero.highlight, locale)}
        subtitle={l(about.hero.subtitle, locale)}
        image={about.hero.image}
      />

      <div className="wrap page-body">
        <div className="split">
          <section aria-labelledby="story-title">
            <span className="eyebrow">{t('ourStory')}</span>
            <h2 id="story-title" className="section-title mb-5">{l(about.story.title, locale)}</h2>
            <div className="grid gap-4">
              {about.story.body.map((p, i) => (
                <p key={i} className={i === 0 ? 'answer' : undefined} data-speakable={i === 0 || undefined}>{l(p, locale)}</p>
              ))}
            </div>
          </section>
          <div className="grid gap-5">
            <div className="mv-grid">
              <Reveal className="mv-card"><h3>{t('mission')}</h3><p>{l(about.mission, locale)}</p></Reveal>
              <Reveal className="mv-card" delay={100}><h3>{t('vision')}</h3><p>{l(about.vision, locale)}</p></Reveal>
            </div>
            {stats.length > 0 && (
              <div className="stats-band !mt-0 !justify-start">
                {stats.map((s) => (
                  <div key={s.key} className="stat-pill">
                    <strong>{format.number(s.value)}{s.suffix}{s.is_placeholder && <span className="todo-badge">TODO</span>}</strong>
                    <span>{l(s.label, locale)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="block" aria-labelledby="values-title">
          <h2 id="values-title">{t('values')}</h2>
          <div className="card-grid cols-4">
            {about.values.map((v, i) => (
              <Reveal key={i} className="tile" delay={(i % 4) * 80}>
                <h3>{l(v.title, locale)}</h3>
                <p>{l(v.text, locale)}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {about.milestones.length > 0 && (
          <section className="block" aria-labelledby="milestones-title">
            <h2 id="milestones-title">{t('milestones')}</h2>
            <ol className="timeline">
              {about.milestones.map((m, i) => (
                <li key={i}>
                  <strong>{m.year}{m.year === 'TODO' && <span className="todo-badge">TODO</span>}</strong>
                  <p>{l(m.text, locale)}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {accreditations.length > 0 && (
          <section className="block" aria-labelledby="acc-title">
            <h2 id="acc-title">{t('accreditations')}</h2>
            <ul className="uni-list">
              {accreditations.map((a) => (
                <li key={a.id}>
                  <ShieldCheck size={20} aria-hidden />
                  <span>
                    <strong>{a.verify_url ? <a href={a.verify_url} target="_blank" rel="noopener">{a.name}</a> : a.name}</strong>
                    {a.is_placeholder && <span className="todo-badge">TODO</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Edge heading={home.edge} items={edge} locale={locale} />
      <CtaBanner home={home} locale={locale} />
      <JsonLd data={speakableWebPageSchema({ name: tm('about'), url: absoluteUrl(locale, '/about'), dateModified: site.updated_at })} />
    </>
  );
}

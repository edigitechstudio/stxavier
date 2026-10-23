import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DynamicIcon } from '@/components/icons';
import { CtaBanner } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { LastUpdated } from '@/components/seo/last-updated';
import { FaqBlock } from '@/components/sx/faq-section';
import { PageHero } from '@/components/sx/page-hero';
import { Link } from '@/i18n/navigation';
import { getFaqs, getHomeContent, getNavigation, getToolContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { speakableWebPageSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';
import type { Faq } from '@/types/content';

export async function toolMetadata(slug: string): Promise<Metadata> {
  const [locale, content] = await Promise.all([currentLocale(), getToolContent(slug)]);
  if (!content) return {};
  return pageMetadata({
    locale,
    path: `/tools/${slug}`,
    title: l(content.hero.title, locale) ?? slug,
    description: (l(content.hero.subtitle, locale) ?? '') + ' ' + (l(content.answer, locale) ?? '').slice(0, 90),
  });
}

/**
 * Shared layout for every tool: hero → interactive widget → answer-first explanation →
 * FAQ (question-style sections + scoped FAQs, with schema) → related tools → CTA.
 */
export async function ToolPage({ slug, children }: { slug: string; children: ReactNode }) {
  const locale = await currentLocale();
  const [content, nav, scoped, home, t, tm] = await Promise.all([
    getToolContent(slug),
    getNavigation('header'),
    getFaqs(`tool:${slug}`),
    getHomeContent(),
    getTranslations('tools'),
    getTranslations('meta'),
  ]);
  if (!content) notFound();

  const title = l(content.hero.title, locale) ?? slug;
  const tools = nav.find((n) => n.id === 'tools')?.children ?? [];
  const related = tools.filter((x) => x.href !== `/tools/${slug}`).slice(0, 3);
  const isQuestion = (h: string) => /[?？]\s*$/.test(h);
  const prose = content.sections.filter((s) => !isQuestion(l(s.heading, locale) ?? ''));
  const faqs: Faq[] = [
    ...content.sections
      .filter((s) => isQuestion(l(s.heading, locale) ?? ''))
      .map((s, i) => ({
        id: `${slug}-${i}`,
        scope: '',
        sort: i,
        published: true,
        question: s.heading,
        answer: { en: s.body.map((b) => l(b, 'en')).join(' '), ne: s.body.map((b) => l(b, 'ne')).join(' ') },
      })),
    ...scoped,
  ];

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbTools'), href: '/tools' }, { label: title, href: `/tools/${slug}` }]}
        eyebrow={l(content.hero.eyebrow, locale)}
        title={title}
        highlight={l(content.hero.highlight, locale)}
        subtitle={l(content.hero.subtitle, locale)}
      />

      <div className="wrap page-body">
        {children}

        <article className="block" style={{ maxWidth: 860 }}>
          <p className="answer" data-speakable>{l(content.answer, locale)}</p>
          <p className="meta-row"><LastUpdated date={content.updated} /></p>
          {prose.map((s, i) => (
            <section key={i} className="block !pt-10">
              <h2>{l(s.heading, locale)}</h2>
              {s.body.map((b, j) => <p key={j}>{l(b, locale)}</p>)}
            </section>
          ))}
          <FaqBlock id="faq" faqs={faqs} locale={locale} />
        </article>

        {related.length > 0 && (
          <section className="block" aria-labelledby="related-title">
            <h2 id="related-title">{t('related')}</h2>
            <div className="card-grid">
              {related.map((tool) => (
                <Link key={tool.id} href={tool.href ?? '/tools'} className="tool-card h-full">
                  <span className="tool-icon"><DynamicIcon name={tool.icon} className="size-[22px]" /></span>
                  <h3>{l(tool.label, locale)}</h3>
                  {tool.description && <p>{l(tool.description, locale)}</p>}
                  <span className="link-arrow">{t('open')} <ArrowRight size={16} aria-hidden /></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <CtaBanner home={home} locale={locale} />
      <JsonLd data={speakableWebPageSchema({ name: title, url: absoluteUrl(locale, `/tools/${slug}`), dateModified: content.updated })} />
    </>
  );
}

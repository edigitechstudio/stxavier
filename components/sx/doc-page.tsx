import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LastUpdated } from '@/components/seo/last-updated';
import { getPageContent } from '@/lib/content';
import { env } from '@/lib/env';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';
import type { PageId } from '@/types/content';
import { PageHero } from './page-hero';

type DocId = Extract<PageId, 'privacy-policy' | 'terms' | 'cookie-policy' | 'editorial-policy'>;

export async function docMetadata(id: DocId): Promise<Metadata> {
  const [locale, doc] = await Promise.all([currentLocale(), getPageContent(id)]);
  const title = l(doc.title, locale) ?? id;
  return pageMetadata({ locale, path: `/${id}`, title, description: (l(doc.intro, locale) ?? title).slice(0, 155) });
}

/** Legal / policy page rendered from `page_content` (editable without code). */
export async function DocPage({ id }: { id: DocId }) {
  const [locale, doc, t] = await Promise.all([currentLocale(), getPageContent(id), getTranslations('pages')]);
  const title = l(doc.title, locale) ?? id;

  return (
    <>
      <PageHero crumbs={[{ label: title, href: `/${id}` }]} title={title} subtitle={l(doc.intro, locale)} />
      <div className="wrap page-body">
        <article className="doc">
          {doc.needs_review && !env.isProduction && (
            <p className="draft-banner"><AlertTriangle size={18} aria-hidden /> {t('draft')}</p>
          )}
          <p className="meta-row !mt-0"><LastUpdated date={doc.updated} /></p>
          {doc.sections.map((s, i) => (
            <section key={i}>
              <h2>{l(s.heading, locale)}</h2>
              {s.body.map((p, j) => <p key={j}>{l(p, locale)}</p>)}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}

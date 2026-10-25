import { ExternalLink } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Source } from '@/types/content';

/** "Official sources" list with access dates. Citation-worthy references for readers and AI engines. */
export async function SourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  const [t, tp] = await Promise.all([getTranslations('common'), getTranslations('pages')]);
  return (
    <aside className="sources" aria-label={tp('sources')}>
      <h2>{tp('sources')}</h2>
      <ul className="grid gap-2">
        {sources.map((s) => (
          <li key={s.url} className="text-sm">
            {t('source')}:{' '}
            <a href={s.url} target="_blank" rel="noopener">
              {s.label} <ExternalLink size={12} className="inline" aria-hidden />
            </a>{' '}
            <span className="muted">
              ({t('accessed')} <time dateTime={s.accessed}>{s.accessed}</time>)
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

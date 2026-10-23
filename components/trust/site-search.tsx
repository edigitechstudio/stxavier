'use client';
import { Fragment, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuerySync } from '@/components/tools/shared';
import { Link } from '@/i18n/navigation';

export type SearchDoc = { type: 'destination' | 'university' | 'post' | 'faq' | 'tool' | 'page' | 'course' | 'service'; title: string; text: string; href: string };

const norm = (s: string) => s.toLowerCase().normalize('NFKD');

function highlight(text: string, terms: string[]) {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>));
}

/** Instant site search over a prebuilt index (content is server-rendered; this only ranks it). */
export function SiteSearch({ docs }: { docs: SearchDoc[] }) {
  const t = useTranslations('trust.search');
  const [q, setQ] = useState('');
  useQuerySync((p) => setQ(p.get('q') ?? ''), { q: q.trim() || undefined });

  const terms = norm(q).split(/\s+/).filter((w) => w.length > 1);
  const results = useMemo(() => {
    if (!terms.length) return [];
    return docs
      .map((d) => {
        const title = norm(d.title);
        const body = norm(d.text);
        if (!terms.every((w) => title.includes(w) || body.includes(w))) return null;
        const score = terms.reduce((a, w) => a + (title.includes(w) ? 3 : 0) + (title.startsWith(w) ? 2 : 0) + (body.includes(w) ? 1 : 0), 0);
        return { d, score };
      })
      .filter((x) => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.d);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terms derives from q
  }, [docs, q]);

  const snippet = (text: string) => {
    const i = terms.length ? norm(text).indexOf(terms[0]) : -1;
    const start = Math.max(0, i - 60);
    return (start > 0 ? '…' : '') + text.slice(start, start + 180) + (text.length > start + 180 ? '…' : '');
  };

  return (
    <>
      <form className="hub-search" role="search" onSubmit={(e) => e.preventDefault()}>
        <Search size={20} aria-hidden />
        <label htmlFor="site-search" className="sr-only">{t('placeholder')}</label>
        <input id="site-search" className="control" type="search" placeholder={t('placeholder')} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      </form>
      <p className="result-count text-center" role="status">
        {!terms.length ? t('prompt') : results.length ? t('results', { n: results.length, q: q.trim() }) : t('none', { q: q.trim() })}
      </p>
      <div className="search-results">
        {results.map((d) => (
          <Link key={`${d.type}-${d.href}-${d.title}`} href={d.href} className="search-hit">
            <small>{t(`types.${d.type}`)}</small>
            <strong>{highlight(d.title, terms)}</strong>
            {d.text && <span>{highlight(snippet(d.text), terms)}</span>}
          </Link>
        ))}
      </div>
    </>
  );
}

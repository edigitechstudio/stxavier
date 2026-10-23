'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FaqList, type FaqItem } from '@/components/home/faq-list';
import { useQuerySync } from '@/components/tools/shared';

export type FaqGroup = { key: string; title: string; items: FaqItem[] };

const normalize = (s: string) => s.toLowerCase().normalize('NFKD');

/** All FAQs grouped by topic, with instant client-side search (answers stay in the HTML). */
export function FaqHub({ groups }: { groups: FaqGroup[] }) {
  const t = useTranslations('trust.faq');
  const [q, setQ] = useState('');
  useQuerySync((p) => setQ(p.get('q') ?? ''), { q: q.trim() || undefined });

  const terms = normalize(q).split(/\s+/).filter((w) => w.length > 1);
  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({ ...g, items: terms.length ? g.items.filter((i) => terms.every((w) => normalize(`${i.question} ${i.answer}`).includes(w))) : g.items }))
        .filter((g) => g.items.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- terms derives from q
    [groups, q],
  );
  const total = filtered.reduce((a, g) => a + g.items.length, 0);

  return (
    <>
      <div className="hub-search">
        <Search size={20} aria-hidden />
        <label htmlFor="faq-search" className="sr-only">{t('search')}</label>
        <input id="faq-search" className="control" type="search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="result-count text-center" role="status">{total ? t('results', { n: total }) : t('none')}</p>
      <div className="mx-auto max-w-[860px]">
        {filtered.map((g) => (
          <section key={g.key} className="faq-group" aria-labelledby={`grp-${g.key}`}>
            <h2 id={`grp-${g.key}`}>{g.title}</h2>
            <FaqList items={g.items} />
          </section>
        ))}
      </div>
    </>
  );
}

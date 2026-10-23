'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuerySync } from '@/components/tools/shared';
import { PostCard, type PostCardData } from './post-card';

type Opt = { value: string; label: string };

/** Blog listing with topic + country filters kept in the URL (shareable, back-button friendly). */
export function BlogList({ posts, topics, countries, initialTopic = '' }: { posts: PostCardData[]; topics: Opt[]; countries: Opt[]; initialTopic?: string }) {
  const t = useTranslations('trust.blog');
  const [topic, setTopic] = useState(initialTopic);
  const [country, setCountry] = useState('');
  useQuerySync(
    (q) => {
      if (!initialTopic) setTopic(q.get('topic') ?? '');
      setCountry(q.get('country') ?? '');
    },
    initialTopic ? { country: country || undefined } : { topic: topic || undefined, country: country || undefined },
  );

  const shown = posts.filter((p) => (!topic || p.topic === topic) && (!country || p.countries.includes(country)));

  return (
    <>
      {!initialTopic && (
        <div className="blog-filters" role="group" aria-label={t('allTopics')}>
          <button type="button" className="chip-toggle" aria-pressed={!topic} onClick={() => setTopic('')}>{t('allTopics')}</button>
          {topics.map((o) => (
            <button key={o.value} type="button" className="chip-toggle" aria-pressed={topic === o.value} onClick={() => setTopic(o.value)}>{o.label}</button>
          ))}
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="result-count !mb-0" role="status">{shown.length ? t('count', { n: shown.length }) : t('none')}</p>
        <label className="field !flex-row items-center gap-2">
          {t('country')}
          <select className="control !w-auto" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">—</option>
            {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
      </div>
      <div className="card-grid">
        {shown.map((p) => <PostCard key={p.slug} post={p} headingLevel="h2" />)}
      </div>
    </>
  );
}

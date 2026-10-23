'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LEVELS, type Level } from '@/types/tools';
import { PrintHeader, Segmented, ToolActions, useQuerySync } from './shared';
import type { ToolDestination } from './types';

const STORE = 'sx-checklist';

function loadTicks(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function DocumentChecklist({ destinations, extras }: { destinations: ToolDestination[]; extras: Partial<Record<Level, string[]>> }) {
  const t = useTranslations('tools');
  const tc = useTranslations('tools.checklist');
  const usable = destinations.filter((d) => d.documents.length);
  const [slug, setSlug] = useState(usable[0]?.slug ?? '');
  const [level, setLevel] = useState<Level>('pg');
  const [ticks, setTicks] = useState<Record<string, boolean>>({});

  useQuerySync(
    (q) => {
      setTicks(loadTicks());
      const c = q.get('country');
      if (c && usable.some((d) => d.slug === c)) setSlug(c);
      const lv = q.get('level') as Level | null;
      if (lv && LEVELS.includes(lv)) setLevel(lv);
    },
    { country: slug, level },
  );

  const dest = usable.find((d) => d.slug === slug) ?? usable[0];
  const groups = useMemo(
    () => [
      { title: tc('base'), items: dest?.documents ?? [] },
      { title: tc('extra'), items: extras[level] ?? [] },
    ].filter((g) => g.items.length),
    [dest, extras, level, tc],
  );
  const keyOf = (item: string) => `${slug}|${level}|${item}`;
  const all = groups.flatMap((g) => g.items);
  const done = all.filter((i) => ticks[keyOf(i)]).length;

  const toggle = (item: string) => {
    const next = { ...ticks, [keyOf(item)]: !ticks[keyOf(item)] };
    setTicks(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* storage blocked: ticks last for this visit only */
    }
  };
  const clear = () => {
    const next = Object.fromEntries(Object.entries(ticks).filter(([k]) => !k.startsWith(`${slug}|${level}|`)));
    setTicks(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  if (!dest) return null;
  return (
    <div className="tool-shell print-area">
      <PrintHeader title={`${dest.name} · ${t(`levels.${level}`)}`} />
      <div className="form-grid no-print">
        <label className="field">
          {t('country')}
          <select className="control" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {usable.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
        </label>
        <div className="field">
          {t('level')}
          <Segmented label={t('level')} value={level} onChange={setLevel} options={LEVELS.map((lv) => ({ value: lv, label: t(`levels.${lv}`) }))} />
        </div>
      </div>

      <div className="mt-6">
        <div className="progress-label">
          <span>{tc('progress', { done, total: all.length })}</span>
          <span className="muted text-xs no-print">{tc('saved')}</span>
        </div>
        <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={done} aria-label={tc('progress', { done, total: all.length })}>
          <span style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="mt-6">
          <h3 className="mb-3 text-lg font-extrabold">{g.title}</h3>
          <div className="check-group">
            {g.items.map((item) => {
              const checked = !!ticks[keyOf(item)];
              return (
                <label key={item} className={`check-item ${checked ? 'is-done' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(item)} />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      <ToolActions>
        <button type="button" className="btn btn-outline btn-sm" onClick={clear}>{tc('clear')}</button>
      </ToolActions>
    </div>
  );
}

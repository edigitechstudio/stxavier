'use client';
import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Flag } from '@/components/brand/flag';
import { LEVELS, type Level } from '@/types/tools';
import { useQuerySync } from './shared';

export type ScholarshipItem = {
  id: string;
  name: string;
  provider: string;
  countries: string[];
  levels: Level[];
  fields: string[];
  min_percent: number | null;
  coverage: 'full' | 'partial';
  amount: string;
  summary: string;
  deadline: string | null;
  url: string;
};

type Option = { value: string; label: string };

export function ScholarshipFinder({
  scholarships,
  countries,
  fields,
  flags,
}: {
  scholarships: ScholarshipItem[];
  countries: Option[];
  fields: Option[];
  flags: Record<string, string>;
}) {
  const t = useTranslations('tools');
  const ts = useTranslations('tools.scholarship');
  const [country, setCountry] = useState('');
  const [level, setLevel] = useState<Level | ''>('');
  const [field, setField] = useState('');
  const [percent, setPercent] = useState('');

  useQuerySync(
    (q) => {
      setCountry(q.get('country') ?? '');
      const lv = q.get('level') as Level | null;
      setLevel(lv && LEVELS.includes(lv) ? lv : '');
      setField(q.get('field') ?? '');
      setPercent(q.get('percent') ?? '');
    },
    { country, level, field, percent },
  );

  const matches = useMemo(() => {
    const pct = percent === '' ? null : Number(percent);
    return scholarships.filter(
      (s) =>
        (!country || s.countries.includes(country)) &&
        (!level || s.levels.includes(level)) &&
        (!field || s.fields.includes('any') || s.fields.includes(field)) &&
        (pct == null || s.min_percent == null || pct >= s.min_percent),
    );
  }, [scholarships, country, level, field, percent]);

  const countryName = (slug: string) => countries.find((c) => c.value === slug)?.label ?? slug;

  return (
    <div className="tool-shell">
      <div className="filter-bar">
        <label className="field">
          {t('country')}
          <select className="control" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t('any')}</option>
            {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="field">
          {t('level')}
          <select className="control" value={level} onChange={(e) => setLevel(e.target.value as Level | '')}>
            <option value="">{t('any')}</option>
            {LEVELS.map((lv) => <option key={lv} value={lv}>{t(`levels.${lv}`)}</option>)}
          </select>
        </label>
        <label className="field">
          {ts('field')}
          <select className="control" value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">{t('any')}</option>
            {fields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <label className="field">
          {ts('percent')}
          <div className="input-suffix">
            <input className="control" type="number" inputMode="decimal" min={0} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="—" />
            <span>%</span>
          </div>
        </label>
      </div>

      <p className="result-count" role="status">{matches.length ? ts('results', { n: matches.length }) : ts('none')}</p>
      <div className="card-grid">
        {matches.map((s) => (
          <article key={s.id} className="sch-card">
            <div className="sch-head">
              <h3>{s.name}</h3>
              <span className={`coverage ${s.coverage === 'full' ? 'is-full' : 'is-partial'}`}>{s.coverage === 'full' ? ts('full') : ts('partial')}</span>
            </div>
            <p className="team-role">{s.provider}</p>
            <p className="text-sm">{s.summary}</p>
            <div className="sch-meta">
              <span><strong>{ts('amount')}:</strong> {s.amount}</span>
              {s.deadline && <span><strong>{ts('deadline')}:</strong> {s.deadline}</span>}
              {s.min_percent != null && <span>{ts('minPercent', { n: s.min_percent })}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {s.countries.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  {flags[c] && <Flag code={flags[c]} className="h-3 w-[18px]" />} {countryName(c)}
                </span>
              ))}
            </div>
            <a href={s.url} target="_blank" rel="noopener" className="link-arrow">
              {ts('official')} <ExternalLink size={14} aria-hidden />
            </a>
          </article>
        ))}
      </div>
      <p className="tool-note">{ts('verify')}</p>
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, MapPin, Search, Trophy } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Flag } from '@/components/brand/flag';
import { useFormatters, useQuerySync } from '@/components/tools/shared';
import { Link } from '@/i18n/navigation';

export type DirUniversity = {
  slug: string;
  name: string;
  country: string;
  countryName: string;
  iso2: string;
  city: string;
  logo: string | null;
  ranking: number | null;
  rankingSource: string | null;
  feeNprMin: number | null;
  feeNprMax: number | null;
  intakes: number[];
  fields: string[];
  courses: string[];
  isPartner: boolean;
};

type Opt = { value: string; label: string };
const RANKS = { top100: 100, top300: 300, top500: 500 } as const;
const FEES = { lt20: [0, 2_000_000], '20to35': [2_000_000, 3_500_000], '35to50': [3_500_000, 5_000_000], gt50: [5_000_000, Infinity] } as const;

/** Debounce a fast-changing value (search input) so filtering doesn't run on every keystroke. */
function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return v;
}

const initials = (name: string) => name.replace(/University of |University|College|Polytechnic/g, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase() || name[0];

export function UniversityDirectory({ universities, countries, fields }: { universities: DirUniversity[]; countries: Opt[]; fields: Opt[] }) {
  const t = useTranslations('trust.universities');
  const locale = useLocale();
  const fmt = useFormatters();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [field, setField] = useState('');
  const [intake, setIntake] = useState('');
  const [rank, setRank] = useState('');
  const [fee, setFee] = useState('');
  const query = useDebounced(q.trim().toLowerCase());

  useQuerySync(
    (p) => {
      setQ(p.get('q') ?? '');
      setCountry(p.get('country') ?? '');
      setField(p.get('field') ?? '');
      setIntake(p.get('intake') ?? '');
      setRank(p.get('rank') ?? '');
      setFee(p.get('fee') ?? '');
    },
    { q: query || undefined, country: country || undefined, field: field || undefined, intake: intake || undefined, rank: rank || undefined, fee: fee || undefined },
  );

  const monthName = (m: number) => new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-GB', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m - 1, 1)));
  const months = [...new Set(universities.flatMap((u) => u.intakes))].sort((a, b) => a - b);

  const results = useMemo(() => {
    return universities.filter((u) => {
      if (query && !`${u.name} ${u.city} ${u.countryName} ${u.courses.join(' ')}`.toLowerCase().includes(query)) return false;
      if (country && u.country !== country) return false;
      if (field && !u.fields.includes(field)) return false;
      if (intake && !u.intakes.includes(Number(intake))) return false;
      if (rank && (u.ranking == null || u.ranking > RANKS[rank as keyof typeof RANKS])) return false;
      if (fee) {
        const [lo, hi] = FEES[fee as keyof typeof FEES];
        if (u.feeNprMin == null || u.feeNprMax == null || u.feeNprMax < lo || u.feeNprMin >= hi) return false;
      }
      return true;
    });
  }, [universities, query, country, field, intake, rank, fee]);

  const clear = () => {
    setQ('');
    setCountry('');
    setField('');
    setIntake('');
    setRank('');
    setFee('');
  };

  const select = (label: string, value: string, set: (v: string) => void, options: Opt[]) => (
    <label className="field">
      {label}
      <select className="control" value={value} onChange={(e) => set(e.target.value)}>
        <option value="">{t('any')}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <div className="dir-search">
        <Search size={18} aria-hidden />
        <label className="sr-only" htmlFor="uni-search">{t('search')}</label>
        <input id="uni-search" className="control" type="search" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="dir-layout">
        <aside className="dir-filters" aria-label={t('filters')}>
          {select(t('country'), country, setCountry, countries)}
          {select(t('field'), field, setField, fields)}
          {select(t('intake'), intake, setIntake, months.map((m) => ({ value: String(m), label: monthName(m) })))}
          {select(t('ranking'), rank, setRank, (Object.keys(RANKS) as (keyof typeof RANKS)[]).map((k) => ({ value: k, label: t(`rank.${k}`) })))}
          {select(t('fees'), fee, setFee, (Object.keys(FEES) as (keyof typeof FEES)[]).map((k) => ({ value: k, label: t(`fee.${k}`) })))}
          <button type="button" className="btn btn-outline btn-sm" onClick={clear}>{t('clear')}</button>
        </aside>
        <div>
          <h2 className="sr-only">{t('listHeading')}</h2>
          <p className="result-count" role="status">{results.length ? t('results', { n: results.length }) : t('none')}</p>
          <div className="uni-grid">
            {results.map((u) => (
              <article key={u.slug} className="uni-card">
                <div className="uni-head">
                  {/* eslint-disable-next-line @next/next/no-img-element -- CMS logos of unknown size */}
                  <span className="uni-logo">{u.logo ? <img src={u.logo} alt="" loading="lazy" /> : initials(u.name)}</span>
                  <div>
                    <h3><Link href={`/universities/${u.slug}`}>{u.name}</Link></h3>
                    {u.isPartner && <span className="partner-badge">{t('partner')}</span>}
                  </div>
                </div>
                <div className="uni-meta">
                  <span><Flag code={u.iso2} className="h-3 w-[18px]" /> {u.city}, {u.countryName}</span>
                  <span><Trophy size={13} aria-hidden /> {u.ranking ? `#${u.ranking}${u.rankingSource ? ` (${u.rankingSource})` : ''}` : t('notRanked')}</span>
                  <span><Calendar size={13} aria-hidden /> {u.intakes.map(monthName).join(', ')}</span>
                </div>
                {u.feeNprMin != null && u.feeNprMax != null && (
                  <p className="text-sm"><strong className="text-[var(--ink)]">{t('tuition')}:</strong> {fmt.npr(u.feeNprMin)} – {fmt.npr(u.feeNprMax)}</p>
                )}
                <div className="uni-tags">{u.courses.slice(0, 3).map((c) => <span key={c}>{c}</span>)}</div>
                <Link href={`/universities/${u.slug}`} className="link-arrow">
                  {t('more')} <ArrowRight size={15} aria-hidden /><span className="sr-only">: {u.name}</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
      <p className="tool-note"><MapPin size={12} className="inline" aria-hidden /> {t('tuitionNote')}</p>
    </>
  );
}

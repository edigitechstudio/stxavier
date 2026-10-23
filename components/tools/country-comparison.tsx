'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Flag } from '@/components/brand/flag';
import { firstYearMidNpr } from '@/lib/calc/cost';
import { Link } from '@/i18n/navigation';
import { PrintHeader, ToolActions, useFormatters, useQuerySync } from './shared';
import type { ToolDestination, ToolRates } from './types';

const MAX = 3;

export function CountryComparison({ destinations, rates }: { destinations: ToolDestination[]; rates: ToolRates }) {
  const t = useTranslations('tools.compare');
  const te = useTranslations('tools.eligibility');
  const fmt = useFormatters();
  const [selected, setSelected] = useState<string[]>(destinations.slice(0, 3).map((d) => d.slug));
  const [warn, setWarn] = useState(false);

  useQuerySync(
    (q) => {
      const picked = q.get('c')?.split(',').filter((s) => destinations.some((d) => d.slug === s)).slice(0, MAX);
      if (picked?.length) setSelected(picked);
    },
    { c: selected.join(',') },
  );

  const toggle = (slug: string) => {
    setWarn(false);
    setSelected((s) => {
      if (s.includes(slug)) return s.filter((x) => x !== slug);
      if (s.length >= MAX) {
        setWarn(true);
        return s;
      }
      return [...s, slug];
    });
  };

  const cols = selected.map((s) => destinations.find((d) => d.slug === s)!).filter(Boolean);
  const money = (n: number, c: string) => fmt.money(n, c);
  const rows: { label: string; value: (d: ToolDestination) => string }[] = [
    { label: t('firstYear'), value: (d) => { const v = d.cost ? firstYearMidNpr(d.cost, 'pg', 'major', rates.rates[d.cost.currency] ?? null) : null; return v ? fmt.npr(v) : '—'; } },
    { label: t('rows.tuition'), value: (d) => (d.cost?.tuition.pg ? `${money(d.cost.tuition.pg[0], d.cost.currency)} – ${money(d.cost.tuition.pg[1], d.cost.currency)}` : '—') },
    { label: t('rows.living'), value: (d) => (d.cost ? money(d.cost.living_monthly.major, d.cost.currency) : '—') },
    { label: t('rows.work'), value: (d) => d.facts.work ?? '—' },
    { label: t('rows.postStudy'), value: (d) => d.facts.postStudy ?? '—' },
    { label: t('rows.pr'), value: (d) => d.facts.pr ?? '—' },
    { label: t('rows.intakes'), value: (d) => d.facts.intakes ?? '—' },
    { label: t('rows.processing'), value: (d) => d.facts.processing ?? '—' },
  ];

  return (
    <div className="tool-shell print-area">
      <PrintHeader title={cols.map((c) => c.name).join(' vs ')} />
      <div className="no-print">
        <p className="field mb-3">{t('pick')}</p>
        <div className="chip-toggles" role="group" aria-label={t('pick')}>
          {destinations.map((d) => (
            <button key={d.slug} type="button" className="chip-toggle" aria-pressed={selected.includes(d.slug)} onClick={() => toggle(d.slug)}>
              <Flag code={d.iso2} /> {d.name}
            </button>
          ))}
        </div>
        {warn && <p className="tool-note" role="status">{t('limit')}</p>}
      </div>

      {cols.length > 0 && (
        <div className="table-wrap mt-6">
          <table className="data-table compare-table">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">{t('pick')}</span></th>
                {cols.map((d) => (
                  <th key={d.slug} scope="col">
                    <span className="inline-flex items-center gap-2 text-[var(--ink)]"><Flag code={d.iso2} /> {d.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  {cols.map((d) => <td key={d.slug}>{r.value(d)}</td>)}
                </tr>
              ))}
              <tr className="no-print">
                <th scope="row"><span className="sr-only">{te('viewGuide')}</span></th>
                {cols.map((d) => <td key={d.slug}><Link href={`/study-in/${d.slug}`}>{te('viewGuide')} →</Link></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <ToolActions />
    </div>
  );
}

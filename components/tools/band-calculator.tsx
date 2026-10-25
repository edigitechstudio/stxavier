'use client';
import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ieltsOverall, pteOverallEstimate } from '@/lib/calc/english';
import { PrintHeader, Segmented, ToolActions, useFormatters, useQuerySync } from './shared';

export type BandRequirement = {
  id: string;
  country: string;
  kind: 'visa' | 'university';
  label: string;
  ielts_overall: number | null;
  ielts_min_band: number | null;
  pte_overall: number | null;
  note: string | null;
  source_url: string | null;
};

const SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
type Skill = (typeof SKILLS)[number];
const IELTS_OPTIONS = Array.from({ length: 19 }, (_, i) => i * 0.5);

export function BandCalculator({ requirements, countryNames }: { requirements: BandRequirement[]; countryNames: Record<string, string> }) {
  const t = useTranslations('tools.band');
  const tt = useTranslations('tools');
  const fmt = useFormatters();
  const [test, setTest] = useState<'ielts' | 'pte'>('ielts');
  const [ielts, setIelts] = useState<Record<Skill, number>>({ listening: 6.5, reading: 6.5, writing: 6, speaking: 6 });
  const [pte, setPte] = useState<Record<Skill, number>>({ listening: 60, reading: 58, writing: 62, speaking: 55 });

  const scores = test === 'ielts' ? ielts : pte;
  useQuerySync(
    (q) => {
      const parse = (min: number, max: number) =>
        SKILLS.map((s) => Number(q.get(s))).every((v) => Number.isFinite(v) && v >= min && v <= max)
          ? (Object.fromEntries(SKILLS.map((s) => [s, Number(q.get(s))])) as Record<Skill, number>)
          : null;
      if (q.get('test') === 'pte') {
        setTest('pte');
        const v = parse(10, 90);
        if (v) setPte(v);
      } else {
        const v = parse(0, 9);
        if (v && SKILLS.every((s) => v[s] * 2 === Math.round(v[s] * 2))) setIelts(v);
      }
    },
    { test, ...scores },
  );

  const result = useMemo(() => {
    try {
      return test === 'ielts'
        ? ieltsOverall(ielts.listening, ielts.reading, ielts.writing, ielts.speaking)
        : pteOverallEstimate(pte.listening, pte.reading, pte.speaking, pte.writing);
    } catch {
      return null;
    }
  }, [test, ielts, pte]);

  const lowest = Math.min(...SKILLS.map((s) => scores[s]));
  const meets = (r: BandRequirement): boolean | null => {
    if (result == null) return null;
    if (test === 'ielts') {
      if (r.ielts_overall == null && r.ielts_min_band == null) return null;
      return (r.ielts_overall == null || result >= r.ielts_overall) && (r.ielts_min_band == null || lowest >= r.ielts_min_band);
    }
    return r.pte_overall == null ? null : result >= r.pte_overall;
  };

  return (
    <div className="tool-shell print-area">
      <PrintHeader title={test === 'ielts' ? t('ielts') : t('pte')} />
      <div className="tool-grid">
        <div className="tool-form">
          <Segmented
            label={t('ielts')}
            value={test}
            onChange={setTest}
            options={[
              { value: 'ielts', label: t('ielts') },
              { value: 'pte', label: t('pte') },
            ]}
          />
          <div className="form-grid">
            {SKILLS.map((s) => (
              <label key={s} className="field">
                {t(s)}
                {test === 'ielts' ? (
                  <select className="control" value={ielts[s]} onChange={(e) => setIelts({ ...ielts, [s]: Number(e.target.value) })}>
                    {IELTS_OPTIONS.map((v) => <option key={v} value={v}>{v.toFixed(1)}</option>)}
                  </select>
                ) : (
                  <input
                    className="control"
                    type="number"
                    inputMode="numeric"
                    min={10}
                    max={90}
                    value={pte[s]}
                    aria-invalid={pte[s] < 10 || pte[s] > 90}
                    onChange={(e) => setPte({ ...pte, [s]: Number(e.target.value) })}
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="result-hero" aria-live="polite">
            <small>{test === 'ielts' ? t('overall') : t('estimate')}</small>
            <strong>{result == null ? '-' : test === 'ielts' ? fmt.num(result, 1) : fmt.num(result)}</strong>
            <p>{result == null ? t('invalid') : test === 'pte' ? t('estimateNote') : `${t('listening')} · ${t('reading')} · ${t('writing')} · ${t('speaking')}`}</p>
          </div>
          <ToolActions />
        </div>
      </div>

      <h3 className="mt-8 mb-3 text-lg font-extrabold">{t('requirements')}</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">{tt('country')}</th>
              <th scope="col">{t('requirements')}</th>
              <th scope="col">{test === 'ielts' ? 'IELTS' : 'PTE'}</th>
              <th scope="col"><span className="sr-only">{t('meets')}</span></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => {
              const ok = meets(r);
              const need =
                test === 'ielts'
                  ? [r.ielts_overall != null ? fmt.num(r.ielts_overall, 1) : null, r.ielts_min_band != null ? t('minEach', { n: fmt.num(r.ielts_min_band, 1) }) : null].filter(Boolean).join(' · ')
                  : r.pte_overall != null ? fmt.num(r.pte_overall) : '-';
              return (
                <tr key={r.id}>
                  <th scope="row">{countryNames[r.country] ?? r.country}</th>
                  <td>
                    {r.label}
                    <span className="block text-xs muted">{r.kind === 'visa' ? t('visa') : t('university')}{r.note ? ` · ${r.note}` : ''}</span>
                    {r.source_url && <a href={r.source_url} target="_blank" rel="noopener" className="text-xs">{t('source')} ↗</a>}
                  </td>
                  <td>{need || '-'}</td>
                  <td>
                    {ok === null ? '-' : ok ? (
                      <span className="status is-good"><CheckCircle2 size={14} aria-hidden /> {t('meets')}</span>
                    ) : (
                      <span className="status is-gap"><XCircle size={14} aria-hidden /> {t('below')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

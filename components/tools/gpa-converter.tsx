'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { bandForGpa, bandForPercent, gpaToPercent, percentToGpa } from '@/lib/calc/gpa';
import type { GradeBand } from '@/types/tools';
import { Segmented, ToolActions, useFormatters } from './shared';

export type ScaleOption = { id: string; name: string; description: string; max_gpa: number; bands: (Omit<GradeBand, 'remark'> & { remark: string | null })[] };

export function GpaConverter({ scales }: { scales: ScaleOption[] }) {
  const t = useTranslations('tools.gpa');
  const fmt = useFormatters();
  const [scaleId, setScaleId] = useState(scales[0]?.id ?? '');
  const [mode, setMode] = useState<'toPercent' | 'toGpa'>('toPercent');
  const [gpa, setGpa] = useState('3.4');
  const [percent, setPercent] = useState('75');
  const scale = scales.find((s) => s.id === scaleId) ?? scales[0];

  const result = useMemo(() => {
    if (!scale) return null;
    const bands = scale.bands as GradeBand[];
    if (mode === 'toPercent') {
      const g = Number(gpa);
      const pct = gpaToPercent(bands, g, scale.max_gpa);
      return pct == null ? null : { main: `${fmt.num(pct, 1)}%`, band: bandForGpa(bands, g) };
    }
    const p = Number(percent);
    const g = percentToGpa(bands, p, scale.max_gpa);
    return g == null ? null : { main: fmt.num(g, 2), band: bandForPercent(bands, p) };
  }, [scale, mode, gpa, percent, fmt]);

  if (!scale) return null;

  return (
    <div className="tool-shell">
      <div className="tool-grid">
        <div className="tool-form">
          <label className="field">
            {t('scale')}
            <select className="control" value={scaleId} onChange={(e) => setScaleId(e.target.value)}>
              {scales.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <small>{scale.description}</small>
          </label>
          <Segmented
            label={t('scale')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'toPercent', label: t('toPercent') },
              { value: 'toGpa', label: t('toGpa') },
            ]}
          />
          {mode === 'toPercent' ? (
            <label className="field">
              {t('gpa')} (0 – {scale.max_gpa})
              <input className="control" type="number" inputMode="decimal" step="0.01" min={0} max={scale.max_gpa} value={gpa} onChange={(e) => setGpa(e.target.value)} aria-invalid={result == null} />
            </label>
          ) : (
            <label className="field">
              {t('percent')} (0 – 100)
              <div className="input-suffix">
                <input className="control" type="number" inputMode="decimal" step="0.1" min={0} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} aria-invalid={result == null} />
                <span>%</span>
              </div>
            </label>
          )}
        </div>

        <div>
          <div className="result-hero" aria-live="polite">
            <small>{t('result')}</small>
            <strong>{result?.main ?? '—'}</strong>
            <p>{result ? (result.band ? `${t('grade')}: ${result.band.grade}${result.band.remark ? ` · ${result.band.remark}` : ''}` : '') : t('invalid')}</p>
          </div>
          <ToolActions pdf={false} share={false} />
        </div>
      </div>

      <h3 className="mt-8 mb-3 text-lg font-extrabold">{t('bands')} — {scale.name}</h3>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th scope="col">{t('grade')}</th><th scope="col">{t('gpa')}</th><th scope="col">{t('range')}</th></tr>
          </thead>
          <tbody>
            {[...scale.bands].sort((a, b) => b.gpa - a.gpa).map((b) => (
              <tr key={b.grade} aria-current={result?.band?.grade === b.grade || undefined} style={result?.band?.grade === b.grade ? { background: 'var(--tint)' } : undefined}>
                <th scope="row">{b.grade}</th>
                <td>{fmt.num(b.gpa, 1)}</td>
                <td>{b.min}% – {b.max === 100 ? '100%' : `< ${b.max}%`}{b.remark ? ` · ${b.remark}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

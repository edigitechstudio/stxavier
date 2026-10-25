'use client';
import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { calculateEmi, type EmiResult } from '@/lib/calc/emi';
import { PrintHeader, ToolActions, useFormatters, useQuerySync } from './shared';

type Defaults = { principal: number; rate: number; years: number };

/** "Nice" axis maximum and step (1/2/2.5/5 × 10^n). */
function niceScale(max: number, ticks = 4) {
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return { max: step * ticks, step };
}

function RepaymentChart({ years, labels }: { years: EmiResult['years']; labels: { principal: string; interest: string; year: (n: number) => string; title: string } }) {
  const fmt = useFormatters();
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 260;
  const pad = { top: 12, right: 8, bottom: 30, left: 64 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const totals = years.map((y) => y.principal + y.interest);
  const { max, step } = niceScale(Math.max(...totals, 1));
  const band = innerW / years.length;
  const barW = Math.min(44, band * 0.6);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const compact = (v: number) => (v >= 100_000 ? `${fmt.num(v / 100_000, v >= 1_000_000 ? 0 : 1)}L` : fmt.num(v));
  const GAP = 2; // surface gap between stacked segments
  const R = 4; // rounded data-end radius

  return (
    <div className="chart-wrap" ref={wrap} style={{ position: 'relative' }}>
      <div className="chart-legend" aria-hidden>
        <span><i style={{ background: 'var(--chart-1)' }} /> {labels.principal}</span>
        <span><i style={{ background: 'var(--chart-2)' }} /> {labels.interest}</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.title}>
        {Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step).map((v) => (
          <g key={v}>
            <line className="grid-line" x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} />
            <text className="axis-label" x={pad.left - 8} y={y(v) + 4} textAnchor="end">{compact(v)}</text>
          </g>
        ))}
        {years.map((yr, i) => {
          const cx = pad.left + band * i + band / 2;
          const x = cx - barW / 2;
          const pTop = y(yr.principal);
          const iTop = y(yr.principal + yr.interest);
          const base = y(0);
          const pH = Math.max(base - pTop, 0);
          const iH = Math.max(pTop - iTop - GAP, 0);
          return (
            <g key={yr.year} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${labels.year(yr.year)}: ${labels.principal} ${fmt.npr(yr.principal)}, ${labels.interest} ${fmt.npr(yr.interest)}`}>
              {/* Hit target: the whole column, larger than the marks. */}
              <rect className="bar-hit" x={pad.left + band * i} y={pad.top} width={band} height={innerH} />
              <g style={{ opacity: hover === null || hover === i ? 1 : 0.55, transition: 'opacity 0.2s' }}>
                <rect x={x} y={pTop} width={barW} height={pH} fill="var(--chart-1)" rx={iH > 0 ? 0 : R} />
                {iH > 0 && <path d={`M${x},${pTop - GAP} V${iTop + R} Q${x},${iTop} ${x + R},${iTop} H${x + barW - R} Q${x + barW},${iTop} ${x + barW},${iTop + R} V${pTop - GAP} Z`} fill="var(--chart-2)" />}
              </g>
              <text className="axis-label" x={cx} y={H - 10} textAnchor="middle">{yr.year}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="chart-tip"
          style={{
            left: `${((pad.left + band * hover + band / 2) / W) * 100}%`,
            top: 0,
            transform: hover > years.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
          }}
        >
          <b>{labels.year(years[hover].year)}</b>
          <span><i style={{ background: 'var(--chart-1)' }} /> {labels.principal}: {fmt.npr(years[hover].principal)}</span>
          <span><i style={{ background: 'var(--chart-2)' }} /> {labels.interest}: {fmt.npr(years[hover].interest)}</span>
        </div>
      )}
    </div>
  );
}

export function EmiCalculator({ defaults }: { defaults: Defaults }) {
  const t = useTranslations('tools.emi');
  const fmt = useFormatters();
  const [principal, setPrincipal] = useState(defaults.principal);
  const [rate, setRate] = useState(defaults.rate);
  const [years, setYears] = useState(defaults.years);

  useQuerySync(
    (q) => {
      const p = Number(q.get('p'));
      const r = Number(q.get('r'));
      const y = Number(q.get('y'));
      if (p > 0) setPrincipal(p);
      if (r >= 0 && q.has('r')) setRate(r);
      if (y >= 1 && y <= 30) setYears(Math.round(y));
    },
    { p: principal, r: rate, y: years },
  );

  const result = useMemo(() => {
    try {
      return calculateEmi(principal, rate, Math.round(years * 12));
    } catch {
      return null;
    }
  }, [principal, rate, years]);

  return (
    <div className="tool-shell print-area">
      <PrintHeader title={t('emi')} />
      <div className="tool-grid">
        <div className="tool-form">
          <label className="field">
            {t('principal')} (NPR)
            <input className="control" type="number" inputMode="numeric" min={10_000} step={10_000} value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} aria-invalid={!(principal > 0)} />
            <small>{fmt.npr(principal || 0)}</small>
          </label>
          <label className="field">
            {t('rate')}
            <div className="range-row">
              <input className="range" type="range" min={5} max={18} step={0.25} value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-valuetext={`${rate}%`} />
              <span className="range-value">{fmt.num(rate, 2)}%</span>
            </div>
          </label>
          <label className="field">
            {t('years')}
            <div className="range-row">
              <input className="range" type="range" min={1} max={15} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} />
              <span className="range-value">{fmt.num(years)}</span>
            </div>
          </label>
        </div>

        <div>
          <div className="result-hero" aria-live="polite">
            <small>{t('emi')}</small>
            <strong>{result ? fmt.npr(result.emi) : '-'}</strong>
            {!result && <p>{t('invalid')}</p>}
          </div>
          {result && (
            <div className="result-grid">
              <div className="stat-box"><span>{t('totalInterest')}</span><strong>{fmt.npr(result.totalInterest)}</strong></div>
              <div className="stat-box"><span>{t('totalPayment')}</span><strong>{fmt.npr(result.totalPayment)}</strong></div>
            </div>
          )}
          <ToolActions />
        </div>
      </div>

      {result && (
        <>
          <h3 className="mt-8 text-lg font-extrabold">{t('chartTitle')}</h3>
          <RepaymentChart
            years={result.years}
            labels={{ principal: t('principalPart'), interest: t('interestPart'), year: (n) => t('year', { n }), title: t('chartTitle') }}
          />
          <details className="table-toggle">
            <summary>{t('table')}</summary>
            <div className="table-wrap mt-3">
              <table className="data-table">
                <thead>
                  <tr><th scope="col">#</th><th scope="col">{t('principalPart')}</th><th scope="col">{t('interestPart')}</th><th scope="col">{t('balance')}</th></tr>
                </thead>
                <tbody>
                  {result.years.map((y) => (
                    <tr key={y.year}><th scope="row">{t('year', { n: y.year })}</th><td>{fmt.npr(y.principal)}</td><td>{fmt.npr(y.interest)}</td><td>{fmt.npr(y.balance)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

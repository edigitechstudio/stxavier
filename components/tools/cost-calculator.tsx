'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { estimateCost } from '@/lib/calc/cost';
import { l } from '@/lib/i18n/localize';
import { LEVELS, type CityTier, type Level } from '@/types/tools';
import { CounsellingButton } from '@/components/sx/counselling';
import { PrintHeader, Segmented, ToolActions, useFormatters, useQuerySync } from './shared';
import type { ToolDestination, ToolRates } from './types';

const TIERS: CityTier[] = ['major', 'mid', 'small'];

export function CostCalculator({ destinations, rates }: { destinations: ToolDestination[]; rates: ToolRates }) {
  const t = useTranslations('tools');
  const tc = useTranslations('tools.cost');
  const locale = useLocale();
  const fmt = useFormatters();
  const usable = destinations.filter((d) => d.cost);
  const [slug, setSlug] = useState(usable[0]?.slug ?? '');
  const [level, setLevel] = useState<Level>('pg');
  const [tier, setTier] = useState<CityTier>('mid');
  const [years, setYears] = useState(1);
  const dest = usable.find((d) => d.slug === slug) ?? usable[0];
  const profile = dest?.cost ?? null;
  const levels = profile ? LEVELS.filter((lv) => profile.tuition[lv]) : [];

  useQuerySync(
    (q) => {
      const c = q.get('country');
      if (c && usable.some((d) => d.slug === c)) setSlug(c);
      const lv = q.get('level') as Level | null;
      if (lv && LEVELS.includes(lv)) setLevel(lv);
      const ti = q.get('city') as CityTier | null;
      if (ti && TIERS.includes(ti)) setTier(ti);
      const y = Number(q.get('years'));
      if (y >= 1 && y <= 6) setYears(Math.round(y));
    },
    { country: slug, level, city: tier, years },
  );

  const rate = profile ? rates.rates[profile.currency] ?? null : null;
  const breakdown = profile ? estimateCost(profile, level, tier, years, rate) : null;

  const pickCountry = (s: string) => {
    setSlug(s);
    const p = usable.find((d) => d.slug === s)?.cost;
    if (p && !p.tuition[level]) {
      const first = LEVELS.find((lv) => p.tuition[lv]);
      if (first) setLevel(first);
    }
    const ny = p?.default_years[level];
    if (ny) setYears(ny);
  };

  if (!dest || !profile) return null;
  const range = (min: number, max: number, money: (n: number) => string) => (min === max ? money(min) : `${money(min)} – ${money(max)}`);
  const local = (n: number) => fmt.money(n, profile.currency);

  return (
    <div className="tool-shell print-area">
      <PrintHeader title={`${dest.name} · ${t(`levels.${level}`)}`} />
      <div className="tool-grid">
        <div className="tool-form no-print">
          <label className="field">
            {t('country')}
            <select className="control" value={slug} onChange={(e) => pickCountry(e.target.value)}>
              {usable.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </label>
          <div className="field">
            {t('level')}
            <Segmented label={t('level')} value={level} onChange={(v) => { setLevel(v); const y = profile.default_years[v]; if (y) setYears(y); }} options={levels.map((lv) => ({ value: lv, label: t(`levels.${lv}`) }))} />
          </div>
          <div className="field">
            {tc('city')}
            <Segmented label={tc('city')} value={tier} onChange={setTier} options={TIERS.map((ti) => ({ value: ti, label: t(`tiers.${ti}`) }))} />
            <small>{tc('example', { city: profile.cities[tier] })}</small>
          </div>
          <label className="field">
            {tc('years')}
            <div className="range-row">
              <input className="range" type="range" min={1} max={6} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} />
              <span className="range-value">{fmt.num(years)}</span>
            </div>
          </label>
        </div>

        <div>
          {breakdown ? (
            <>
              <div className="result-hero" aria-live="polite">
                <small>{tc('totalFor', { years })}</small>
                <strong>{breakdown.totalNpr ? range(breakdown.totalNpr.min, breakdown.totalNpr.max, fmt.npr) : range(breakdown.total.min, breakdown.total.max, local)}</strong>
                <p>{tc('inLocal', { currency: profile.currency })}: {range(breakdown.total.min, breakdown.total.max, local)}</p>
              </div>
              <div className="table-wrap mt-4">
                <table className="data-table">
                  <caption>{tc('perYear')}</caption>
                  <tbody>
                    <tr><th scope="row">{tc('tuition')}</th><td>{range(breakdown.perYear.tuition.min, breakdown.perYear.tuition.max, local)}</td></tr>
                    <tr><th scope="row">{tc('living')}</th><td>{local(breakdown.perYear.living)}</td></tr>
                    {profile.extras_yearly.map((e, i) => (
                      <tr key={i}><th scope="row">{l(e.label, locale)}</th><td>{local(e.amount)}</td></tr>
                    ))}
                    {profile.one_off.map((e, i) => (
                      <tr key={`o${i}`}><th scope="row">{l(e.label, locale)} <span className="muted text-xs">({tc('oneOff')})</span></th><td>{local(e.amount)}</td></tr>
                    ))}
                    {breakdown.perYearNpr && (
                      <tr><th scope="row">{tc('perYear')} (NPR)</th><td><strong>{range(breakdown.perYearNpr.min, breakdown.perYearNpr.max, fmt.npr)}</strong></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {rate && (
                <p className="tool-note">
                  {tc('rateNote', { currency: profile.currency, rate: fmt.num(rate, 2), source: tc(`sources.${rates.source}`), date: fmt.date(rates.date, 'medium') })} · {t('approx')}
                </p>
              )}
            </>
          ) : (
            <p className="note-card">{tc('notOffered')}</p>
          )}
          <ToolActions>
            <CounsellingButton className="btn btn-primary btn-sm" prefill={{ destination: dest.name }}>{t('book')}</CounsellingButton>
          </ToolActions>
        </div>
      </div>
    </div>
  );
}

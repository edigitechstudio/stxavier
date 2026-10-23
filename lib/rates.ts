import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getPageContent } from '@/lib/content';

export type ExchangeRates = {
  /** NPR per 1 unit of each currency (selling rate). */
  rates: Record<string, number>;
  date: string;
  source: 'nrb' | 'nrb+cross' | 'fallback';
};

const NRB_URL = 'https://www.nrb.org.np/api/forex/v1/rates';
const CROSS_URL = process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD';

type NrbResponse = {
  data?: { payload?: { date: string; rates: { currency: { iso3: string; unit: number }; sell: string }[] }[] };
};

/**
 * Official Nepal Rastra Bank selling rates (refreshed hourly). Currencies NRB does not publish
 * (e.g. NZD) are derived through USD from a secondary source; if everything fails, the dated
 * fallback rates stored in the CMS are used.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  'use cache';
  cacheTag('rates');
  cacheLife('hours');

  const config = await getPageContent('tools');
  const fallback: ExchangeRates = { rates: config.fallback_rates.rates, date: config.fallback_rates.date, source: 'fallback' };

  try {
    // Look back a few days so weekends/holidays still return the latest published rates.
    const to = new Date();
    const from = new Date(to.getTime() - 5 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const res = await fetch(`${NRB_URL}?from=${fmt(from)}&to=${fmt(to)}&per_page=10&page=1`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return fallback;
    const json = (await res.json()) as NrbResponse;
    const latest = json.data?.payload?.at(-1);
    if (!latest?.rates?.length) return fallback;

    const rates: Record<string, number> = {};
    for (const r of latest.rates) {
      const sell = Number(r.sell);
      if (sell > 0 && r.currency.unit > 0) rates[r.currency.iso3] = sell / r.currency.unit;
    }

    let source: ExchangeRates['source'] = 'nrb';
    const missing = Object.keys(fallback.rates).filter((c) => !rates[c]);
    if (missing.length && rates.USD) {
      try {
        const cross = await fetch(CROSS_URL, { signal: AbortSignal.timeout(6000) });
        const cj = (await cross.json()) as { rates?: Record<string, number> };
        for (const c of missing) {
          const perUsd = cj.rates?.[c];
          if (perUsd) {
            rates[c] = rates.USD / perUsd;
            source = 'nrb+cross';
          }
        }
      } catch {
        /* keep NRB-only rates */
      }
    }
    for (const c of missing) if (!rates[c]) rates[c] = fallback.rates[c];

    return { rates, date: latest.date, source };
  } catch {
    return fallback;
  }
}

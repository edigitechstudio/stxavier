import type { CityTier, CostProfile, Level } from '@/types/tools';

export type Range = { min: number; max: number };

export type CostBreakdown = {
  currency: string;
  years: number;
  /** Per-year amounts in local currency. */
  perYear: { tuition: Range; living: number; extras: number; total: Range };
  oneOff: number;
  /** Whole-course totals in local currency. */
  total: Range;
  /** Whole-course totals in NPR (null when no exchange rate is available). */
  totalNpr: Range | null;
  perYearNpr: Range | null;
};

/** Estimate study costs for one destination/level/city tier over `years`. */
export function estimateCost(
  profile: CostProfile,
  level: Level,
  tier: CityTier,
  years: number,
  nprPerUnit: number | null,
): CostBreakdown | null {
  const tuition = profile.tuition[level];
  if (!tuition || !(years > 0)) return null;

  const living = profile.living_monthly[tier] * 12;
  const extras = profile.extras_yearly.reduce((a, e) => a + e.amount, 0);
  const oneOff = profile.one_off.reduce((a, e) => a + e.amount, 0);
  const perYearTotal = { min: tuition[0] + living + extras, max: tuition[1] + living + extras };
  const total = { min: perYearTotal.min * years + oneOff, max: perYearTotal.max * years + oneOff };
  const toNpr = (r: Range) => (nprPerUnit ? { min: r.min * nprPerUnit, max: r.max * nprPerUnit } : null);

  return {
    currency: profile.currency,
    years,
    perYear: { tuition: { min: tuition[0], max: tuition[1] }, living, extras, total: perYearTotal },
    oneOff,
    total,
    totalNpr: toNpr(total),
    perYearNpr: toNpr(perYearTotal),
  };
}

/** Midpoint of the first-year cost in NPR. Used to compare destinations. */
export function firstYearMidNpr(profile: CostProfile, level: Level, tier: CityTier, nprPerUnit: number | null): number | null {
  const b = estimateCost(profile, level, tier, 1, nprPerUnit);
  if (!b?.perYearNpr) return null;
  return (b.perYearNpr.min + b.perYearNpr.max) / 2 + b.oneOff * (nprPerUnit ?? 0);
}

import type { GradeBand } from '@/types/tools';

/**
 * Grade-band conversions for Nepali grading scales (NEB, TU). Bands come from data, so new
 * scales can be added without code changes. Conversions between a continuous GPA and a
 * percentage interpolate linearly between band anchors (gpa ↔ band minimum), which is how
 * most evaluators approximate it — always flagged as approximate in the UI.
 */

const sortedByGpa = (bands: GradeBand[]) => [...bands].sort((a, b) => a.gpa - b.gpa);

/** The band a percentage falls into. */
export function bandForPercent(bands: GradeBand[], percent: number): GradeBand | undefined {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return undefined;
  return bands.find((b) => percent >= b.min && (percent < b.max || (b.max === 100 && percent <= 100)));
}

/** Highest band whose grade point is ≤ the given GPA. */
export function bandForGpa(bands: GradeBand[], gpa: number): GradeBand | undefined {
  const asc = sortedByGpa(bands);
  let found: GradeBand | undefined;
  for (const b of asc) if (gpa >= b.gpa) found = b;
  return found;
}

const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;

/** Approximate percentage for a (possibly fractional) GPA. */
export function gpaToPercent(bands: GradeBand[], gpa: number, maxGpa: number): number | undefined {
  if (!Number.isFinite(gpa) || gpa < 0 || gpa > maxGpa) return undefined;
  const asc = sortedByGpa(bands).filter((b) => b.gpa > 0);
  if (!asc.length) return undefined;
  if (gpa <= asc[0].gpa) return round(asc[0].min * (gpa / asc[0].gpa), 1);
  for (let i = 0; i < asc.length - 1; i++) {
    const lo = asc[i];
    const hi = asc[i + 1];
    if (gpa >= lo.gpa && gpa <= hi.gpa) {
      const t = (gpa - lo.gpa) / (hi.gpa - lo.gpa);
      return round(lo.min + t * (hi.min - lo.min), 1);
    }
  }
  const top = asc[asc.length - 1];
  return round(top.min + ((gpa - top.gpa) / Math.max(maxGpa - top.gpa, 1e-9)) * (100 - top.min), 1);
}

/** Approximate GPA for a percentage (inverse of gpaToPercent). */
export function percentToGpa(bands: GradeBand[], percent: number, maxGpa: number): number | undefined {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return undefined;
  const asc = sortedByGpa(bands).filter((b) => b.gpa > 0);
  if (!asc.length) return undefined;
  if (percent < asc[0].min) return 0;
  for (let i = 0; i < asc.length - 1; i++) {
    const lo = asc[i];
    const hi = asc[i + 1];
    if (percent >= lo.min && percent <= hi.min) {
      const t = (percent - lo.min) / (hi.min - lo.min);
      return round(lo.gpa + t * (hi.gpa - lo.gpa), 2);
    }
  }
  const top = asc[asc.length - 1];
  return round(Math.min(maxGpa, top.gpa + ((percent - top.min) / Math.max(100 - top.min, 1e-9)) * (maxGpa - top.gpa)), 2);
}

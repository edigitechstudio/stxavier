/**
 * IELTS overall band: the mean of the four section bands, rounded to the nearest half band.
 * Official rounding: a mean ending in .25 rounds UP to the next half band and .75 rounds UP
 * to the next whole band (e.g. 6.25 → 6.5, 6.75 → 7.0, 6.125 → 6.0, 6.625 → 6.5).
 */
export function ieltsOverall(listening: number, reading: number, writing: number, speaking: number): number {
  const bands = [listening, reading, writing, speaking];
  for (const b of bands) {
    if (!Number.isFinite(b) || b < 0 || b > 9 || Math.round(b * 2) !== b * 2) {
      throw new RangeError('Each IELTS band must be between 0 and 9 in 0.5 steps');
    }
  }
  // Work in eighths to avoid floating-point error: mean × 8 = sum × 2.
  const eighths = bands.reduce((a, b) => a + b, 0) * 2;
  const whole = Math.floor(eighths / 8);
  const frac = eighths - whole * 8; // 0..7 eighths
  if (frac < 2) return whole; // < .25
  if (frac < 6) return whole + 0.5; // .25 ≤ x < .75
  return whole + 1; // ≥ .75
}

/**
 * PTE Academic's overall score is calculated by Pearson from every item, not by averaging the
 * four communicative skills. So this is only an ESTIMATE for planning.
 */
export function pteOverallEstimate(listening: number, reading: number, speaking: number, writing: number): number {
  const scores = [listening, reading, speaking, writing];
  for (const s of scores) {
    if (!Number.isFinite(s) || s < 10 || s > 90) throw new RangeError('Each PTE score must be between 10 and 90');
  }
  return Math.round(scores.reduce((a, b) => a + b, 0) / 4);
}

/**
 * Approximate PTE → IELTS overall equivalence used for rough eligibility matching only.
 * TODO: confirm against Pearson's current published concordance before relying on it.
 */
const PTE_TO_IELTS: [number, number][] = [
  [84, 8.0],
  [76, 7.5],
  [66, 7.0],
  [56, 6.5],
  [46, 6.0],
  [36, 5.5],
  [29, 5.0],
];

export function pteToIeltsApprox(pte: number): number {
  for (const [min, band] of PTE_TO_IELTS) if (pte >= min) return band;
  return 4.5;
}

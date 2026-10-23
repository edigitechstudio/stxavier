import { describe, expect, it } from 'vitest';
import { estimateCost } from '@/lib/calc/cost';
import { calculateEmi } from '@/lib/calc/emi';
import { rankDestinations, scoreDestination } from '@/lib/calc/eligibility';
import { ieltsOverall, pteOverallEstimate, pteToIeltsApprox } from '@/lib/calc/english';
import { bandForGpa, bandForPercent, gpaToPercent, percentToGpa } from '@/lib/calc/gpa';
import { buildIcs, googleCalendarTimedUrl, googleCalendarUrl, intakeStart, planTimeline } from '@/lib/calc/timeline';
import type { CostProfile, GradeBand, Requirements } from '@/types/tools';

describe('IELTS overall band (official rounding)', () => {
  it.each([
    [[6, 6, 6, 6], 6],
    [[6.5, 6.5, 5, 7], 6.5], // 6.25 → 6.5
    [[4, 3.5, 4, 4], 4], // 3.875 → 4.0
    [[6.5, 6.5, 6.5, 7], 6.5], // 6.625 → 6.5
    [[7, 7, 7, 6.5], 7], // 6.875 → 7.0
    [[6, 6, 6, 6.5], 6], // 6.125 → 6.0
    [[6, 6.5, 6.5, 6.5], 6.5], // 6.375 → 6.5
    [[7, 7, 7.5, 7.5], 7.5], // 7.25 → 7.5
    [[8, 8, 7.5, 7.5], 8], // 7.75 → 8.0
    [[9, 9, 9, 9], 9],
  ])('%j → %d', (bands, expected) => {
    expect(ieltsOverall(bands[0], bands[1], bands[2], bands[3])).toBe(expected);
  });

  it('rejects invalid bands', () => {
    expect(() => ieltsOverall(6.3, 6, 6, 6)).toThrow(RangeError);
    expect(() => ieltsOverall(9.5, 6, 6, 6)).toThrow(RangeError);
  });

  it('PTE estimate averages and validates range', () => {
    expect(pteOverallEstimate(65, 70, 60, 58)).toBe(63);
    expect(() => pteOverallEstimate(5, 70, 60, 58)).toThrow(RangeError);
    expect(pteToIeltsApprox(66)).toBe(7);
    expect(pteToIeltsApprox(10)).toBe(4.5);
  });
});

const NEB: GradeBand[] = [
  { grade: 'A+', gpa: 4.0, min: 90, max: 100, remark: null },
  { grade: 'A', gpa: 3.6, min: 80, max: 90, remark: null },
  { grade: 'B+', gpa: 3.2, min: 70, max: 80, remark: null },
  { grade: 'B', gpa: 2.8, min: 60, max: 70, remark: null },
  { grade: 'C+', gpa: 2.4, min: 50, max: 60, remark: null },
  { grade: 'C', gpa: 2.0, min: 40, max: 50, remark: null },
  { grade: 'D', gpa: 1.6, min: 35, max: 40, remark: null },
  { grade: 'NG', gpa: 0, min: 0, max: 35, remark: null },
];

describe('GPA ↔ percentage (NEB bands)', () => {
  it('finds bands', () => {
    expect(bandForPercent(NEB, 85)?.grade).toBe('A');
    expect(bandForPercent(NEB, 100)?.grade).toBe('A+');
    expect(bandForPercent(NEB, 20)?.grade).toBe('NG');
    expect(bandForGpa(NEB, 3.45)?.grade).toBe('B+');
  });
  it('interpolates both ways and round-trips', () => {
    expect(gpaToPercent(NEB, 3.6, 4)).toBe(80);
    expect(gpaToPercent(NEB, 3.4, 4)).toBe(75);
    expect(percentToGpa(NEB, 75, 4)).toBe(3.4);
    expect(percentToGpa(NEB, 100, 4)).toBe(4);
    expect(percentToGpa(NEB, 20, 4)).toBe(0);
  });
  it('rejects out-of-range input', () => {
    expect(gpaToPercent(NEB, 4.5, 4)).toBeUndefined();
    expect(percentToGpa(NEB, 120, 4)).toBeUndefined();
  });
});

describe('Education loan EMI', () => {
  it('matches the standard reducing-balance formula', () => {
    const r = calculateEmi(1_000_000, 12, 12);
    expect(r.emi).toBeCloseTo(88_848.79, 2);
    expect(r.totalInterest).toBeCloseTo(66_185.46, 1);
    expect(r.years).toHaveLength(1);
    expect(r.years[0].balance).toBeCloseTo(0, 4);
  });
  it('handles a 0% rate and multi-year schedules', () => {
    expect(calculateEmi(120_000, 0, 12).emi).toBe(10_000);
    const r = calculateEmi(2_500_000, 11, 84);
    expect(r.years).toHaveLength(7);
    const principalRepaid = r.years.reduce((a, y) => a + y.principal, 0);
    expect(principalRepaid).toBeCloseTo(2_500_000, 2);
  });
  it('rejects invalid input', () => {
    expect(() => calculateEmi(0, 10, 12)).toThrow(RangeError);
    expect(() => calculateEmi(1000, 10, 0)).toThrow(RangeError);
  });
});

const PROFILE: CostProfile = {
  currency: 'GBP',
  tuition: { ug: [12000, 20000], pg: [14000, 24000] },
  living_monthly: { major: 1400, mid: 1100, small: 950 },
  extras_yearly: [{ label: { en: 'Health surcharge' }, amount: 776 }],
  one_off: [{ label: { en: 'Visa fee' }, amount: 524 }],
  default_years: { ug: 3, pg: 1 },
  cities: { major: 'London', mid: 'Manchester', small: 'Norwich' },
};

describe('Cost of study', () => {
  it('adds tuition, living, extras and one-off costs', () => {
    const c = estimateCost(PROFILE, 'pg', 'mid', 1, 200)!;
    expect(c.perYear.total).toEqual({ min: 14000 + 13200 + 776, max: 24000 + 13200 + 776 });
    expect(c.total).toEqual({ min: 27976 + 524, max: 37976 + 524 });
    expect(c.totalNpr).toEqual({ min: 28500 * 200, max: 38500 * 200 });
  });
  it('multiplies per-year costs by years but one-off costs once', () => {
    const c = estimateCost(PROFILE, 'ug', 'small', 3, null)!;
    expect(c.total.min).toBe((12000 + 11400 + 776) * 3 + 524);
    expect(c.totalNpr).toBeNull();
  });
  it('returns null for levels the destination does not offer', () => {
    expect(estimateCost(PROFILE, 'language', 'major', 1, 200)).toBeNull();
  });
});

describe('Visa timeline', () => {
  const steps = [
    { key: 'visa', label: { en: 'Visa' }, detail: { en: '' }, weeks_before: 8 },
    { key: 'test', label: { en: 'Test' }, detail: { en: '' }, weeks_before: 40 },
  ];
  it('reverse-plans dates in order and flags past steps', () => {
    const plan = planTimeline(intakeStart('2027-09'), steps, '2027-01-01');
    expect(plan.map((p) => p.key)).toEqual(['test', 'visa']);
    expect(plan[0].date).toBe('2026-11-25'); // 280 days before 1 Sep 2027
    expect(plan[0].isPast).toBe(true);
    expect(plan[1].date).toBe('2027-07-07');
    expect(plan[1].isPast).toBe(false);
  });
  it('builds a valid all-day .ics file with escaping and folding', () => {
    const ics = buildIcs(
      [{ uid: 'a@stxavier', date: '2027-07-07', title: 'Visa; apply, now', description: 'x'.repeat(120) }],
      '20261016T000000Z',
      'Plan',
    );
    expect(ics).toContain('DTSTART;VALUE=DATE:20270707');
    expect(ics).toContain('DTEND;VALUE=DATE:20270708');
    expect(ics).toContain('SUMMARY:Visa\\; apply\\, now');
    expect(ics.split('\r\n').every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
  it('converts Nepal-time events to UTC for Google Calendar', () => {
    const url = googleCalendarTimedUrl({ title: 'Fair', description: '', start: '2026-11-14T11:00:00+05:45', end: '2026-11-14T16:00:00+05:45' });
    expect(url).toContain('dates=20261114T051500Z%2F20261114T101500Z');
  });
  it('builds Google Calendar links', () => {
    const url = googleCalendarUrl({ date: '2027-07-07', title: 'Visa', description: 'Apply' });
    expect(url).toContain('dates=20270707%2F20270708');
  });
});

describe('Eligibility scoring', () => {
  const req: Requirements = {
    min_budget_npr: { ug: 3_000_000, pg: 3_500_000 },
    ielts: { ug: 6, pg: 6.5 },
    min_percent: { ug: 60, pg: 55 },
    strong_fields: ['it'],
  };
  const base = {
    level: 'pg' as const,
    percent: 70,
    english: { test: 'ielts' as const, score: 7 },
    budgetNpr: 4_000_000,
    countries: ['uk'],
    field: 'it',
  };
  it('gives a perfect profile 100', () => {
    expect(scoreDestination(base, 'uk', req)?.score).toBe(100);
  });
  it('penalises budget gaps most heavily', () => {
    const low = scoreDestination({ ...base, budgetNpr: 1_000_000 }, 'uk', req)!;
    expect(low.factors.find((f) => f.factor === 'budget')?.status).toBe('gap');
    expect(low.score).toBeLessThan(80);
  });
  it('accepts PTE scores via the approximate concordance', () => {
    const m = scoreDestination({ ...base, english: { test: 'pte', score: 66 } }, 'uk', req)!;
    expect(m.factors.find((f) => f.factor === 'english')?.status).toBe('good');
  });
  it('excludes destinations that do not offer the level and sorts by score', () => {
    const ranked = rankDestinations({ ...base, level: 'language' }, [{ slug: 'uk', requirements: req }]);
    expect(ranked).toHaveLength(0);
    const two = rankDestinations(base, [
      { slug: 'x', requirements: { ...req, strong_fields: [] } },
      { slug: 'uk', requirements: req },
    ]);
    expect(two.map((m) => m.slug)).toEqual(['uk', 'x']);
  });
});

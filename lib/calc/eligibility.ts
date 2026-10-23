import type { Level, Requirements } from '@/types/tools';
import { pteToIeltsApprox } from './english';

export type EligibilityAnswers = {
  level: Level;
  /** Previous study result as a percentage (convert GPA first). */
  percent: number;
  english: { test: 'ielts' | 'pte' | 'none'; score: number | null };
  /** Total yearly budget the family can arrange, in NPR. */
  budgetNpr: number;
  /** Preferred destination slugs (empty = open to all). */
  countries: string[];
  field: string;
};

export type Factor = 'budget' | 'academics' | 'english' | 'preference' | 'field';
export type FactorResult = { factor: Factor; points: number; max: number; status: 'good' | 'ok' | 'gap' };

export type Match = { slug: string; score: number; factors: FactorResult[] };

const WEIGHTS: Record<Factor, number> = { budget: 40, academics: 25, english: 20, preference: 10, field: 5 };

function factor(f: Factor, ratio: number): FactorResult {
  const max = WEIGHTS[f];
  const points = Math.round(max * Math.max(0, Math.min(1, ratio)));
  return { factor: f, points, max, status: ratio >= 0.95 ? 'good' : ratio >= 0.5 ? 'ok' : 'gap' };
}

/**
 * Scores how well a student's profile fits each destination (0–100). Guidance only: the
 * thresholds come from editable destination `requirements`, and real admission decisions are
 * made by institutions.
 */
export function scoreDestination(answers: EligibilityAnswers, slug: string, req: Requirements): Match | null {
  const minBudget = req.min_budget_npr[answers.level];
  if (minBudget == null) return null; // level not offered here

  const budgetRatio = answers.budgetNpr >= minBudget ? 1 : answers.budgetNpr >= minBudget * 0.8 ? 0.6 : (answers.budgetNpr / minBudget) * 0.4;

  const minPct = req.min_percent[answers.level] ?? 0;
  const academicRatio = answers.percent >= minPct ? 1 : answers.percent >= minPct - 5 ? 0.6 : 0.2;

  const needIelts = req.ielts[answers.level];
  let englishRatio: number;
  if (needIelts == null) {
    englishRatio = 1; // English test not the main requirement (e.g. Japanese-language pathway)
  } else if (answers.english.test === 'none' || answers.english.score == null) {
    englishRatio = 0.4; // can still sit the test
  } else {
    const ielts = answers.english.test === 'pte' ? pteToIeltsApprox(answers.english.score) : answers.english.score;
    englishRatio = ielts >= needIelts ? 1 : ielts >= needIelts - 0.5 ? 0.6 : 0.2;
  }

  const preferenceRatio = answers.countries.length === 0 ? 0.5 : answers.countries.includes(slug) ? 1 : 0;
  const fieldRatio = req.strong_fields.includes(answers.field) ? 1 : 0.4;

  const factors = [
    factor('budget', budgetRatio),
    factor('academics', academicRatio),
    factor('english', englishRatio),
    factor('preference', preferenceRatio),
    factor('field', fieldRatio),
  ];
  return { slug, score: factors.reduce((a, f) => a + f.points, 0), factors };
}

export function rankDestinations(answers: EligibilityAnswers, destinations: { slug: string; requirements: Requirements | null }[]): Match[] {
  return destinations
    .map((d) => (d.requirements ? scoreDestination(answers, d.slug, d.requirements) : null))
    .filter((m): m is Match => m !== null)
    .sort((a, b) => b.score - a.score);
}

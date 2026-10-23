import type { Localized, PageHeading, Source } from './content';

/** Study levels used by every tool. */
export type Level = 'language' | 'diploma' | 'ug' | 'pg';
export const LEVELS: Level[] = ['language', 'diploma', 'ug', 'pg'];

export type CityTier = 'major' | 'mid' | 'small';

/** Per-destination cost inputs (local currency). Drives the cost calculator and comparison tool. */
export type CostProfile = {
  currency: string; // ISO 4217, e.g. "GBP"
  /** Annual tuition range per level, [min, max]. Missing level = not offered. */
  tuition: Partial<Record<Level, [number, number]>>;
  /** Typical monthly living cost by city tier. */
  living_monthly: Record<CityTier, number>;
  /** Yearly extras such as health cover. */
  extras_yearly: { label: Localized; amount: number }[];
  /** One-off costs such as the visa fee. */
  one_off: { label: Localized; amount: number }[];
  default_years: Partial<Record<Level, number>>;
  /** Example cities per tier, shown in the selector. */
  cities: Record<CityTier, string>;
};

/** Rough entry requirements used by the eligibility checker (guidance, not admission rules). */
export type Requirements = {
  /** Minimum realistic total budget per year in NPR (tuition + living). */
  min_budget_npr: Partial<Record<Level, number>>;
  /** Typical minimum IELTS overall. Null = English test not the main requirement (e.g. Japan). */
  ielts: Partial<Record<Level, number | null>>;
  /** Typical minimum previous-study percentage. */
  min_percent: Partial<Record<Level, number>>;
  /** Fields this destination is especially strong in (matched against the quiz answer). */
  strong_fields: string[];
};

/** Reverse-planned milestone, N weeks before the intake start date. */
export type TimelineStep = { key: string; label: Localized; detail: Localized; weeks_before: number };

export type Scholarship = {
  id: string;
  name: string;
  provider: string;
  /** Destination slugs. */
  countries: string[];
  levels: Level[];
  /** Field keys, or ["any"]. */
  fields: string[];
  min_percent: number | null;
  coverage: 'full' | 'partial';
  amount: Localized;
  summary: Localized;
  deadline: Localized | null;
  url: string;
  verified_on: string | null;
  sort: number;
  published: boolean;
};

/** Minimum English scores for a visa route or a typical university tier. */
export type EnglishRequirement = {
  id: string;
  country: string; // destination slug
  kind: 'visa' | 'university';
  label: Localized;
  ielts_overall: number | null;
  ielts_min_band: number | null;
  pte_overall: number | null;
  note: Localized | null;
  source_url: string | null;
  sort: number;
  published: boolean;
};

export type GradeBand = { grade: string; gpa: number; min: number; max: number; remark: Localized | null };

export type GradingScale = {
  id: string; // "neb", "tu"
  name: Localized;
  description: Localized;
  max_gpa: number;
  bands: GradeBand[];
  source: Source | null;
  sort: number;
};

/** Editable copy for each tool page (page_content row "tool-<slug>"). */
export type ToolContent = {
  hero: PageHeading;
  /** Answer-first summary shown under the tool. */
  answer: Localized;
  sections: { heading: Localized; body: Localized[] }[];
  updated: string;
};

/** Shared tool settings (page_content row "tools"). */
export type ToolsConfig = {
  index: PageHeading;
  fields: { key: string; label: Localized }[];
  checklist_extras: Partial<Record<Level, Localized[]>>;
  loan_defaults: { principal: number; rate: number; years: number };
  /** Fallback NPR per 1 unit of currency, used when live rates are unavailable. */
  fallback_rates: { date: string; rates: Record<string, number> };
};

import type { CostProfile, Requirements, TimelineStep } from '@/types/tools';

/** Locale-resolved destination data handed from server pages to tool widgets. */
export type ToolDestination = {
  slug: string;
  name: string;
  iso2: string;
  cost: CostProfile | null;
  requirements: Requirements | null;
  timeline: { key: string; label: string; detail: string; weeks_before: number }[];
  documents: string[];
  universities: string[];
  facts: { intakes: string | null; work: string | null; postStudy: string | null; pr: string | null; processing: string | null };
};

export type ToolRates = { rates: Record<string, number>; date: string; source: 'nrb' | 'nrb+cross' | 'fallback' };

export type { TimelineStep };

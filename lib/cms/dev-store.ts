import 'server-only';
import * as seed from '@/data/seed';

/**
 * Editable content for local development WITHOUT Supabase. Starts as a copy of `data/seed`;
 * edits made in /admin/cms change it in memory so the whole site reflects them immediately
 * (until the dev server restarts). With Supabase configured this is never used.
 */
export type ContentRow = Record<string, unknown>;
export type BlogRow = {
  slug: string;
  title: { en: string; ne?: string | null };
  description: { en: string; ne?: string | null };
  body: { en: string; ne?: string | null };
  topic: string;
  countries: string[];
  levels: string[];
  cover: string | null;
  author: string;
  date: string;
  updated: string | null;
  draft: boolean;
  needs_review: boolean;
};
type DevContent = {
  rows: Record<string, ContentRow[]>;
  pages: Record<string, unknown>;
  site: unknown;
  ui: { en: Record<string, string>; ne: Record<string, string> };
  blog: BlogRow[];
};

function init(): DevContent {
  return structuredClone({
    rows: {
      offices: seed.offices,
      nav_items: seed.navItems,
      destinations: seed.destinations,
      services: seed.services,
      test_prep_courses: seed.testPrepCourses,
      stats: seed.stats,
      faqs: seed.faqs,
      accreditations: seed.accreditations,
      features: seed.features,
      testimonials: seed.testimonials,
      partners: seed.partners,
      counsellors: seed.counsellors,
      scholarships: seed.scholarships,
      english_requirements: seed.englishRequirements,
      grading_scales: seed.gradingScales,
      universities: seed.universities,
      events: seed.events,
    } as unknown as Record<string, ContentRow[]>,
    pages: {
      home: seed.homeContent,
      ...seed.pages,
      ...Object.fromEntries(Object.entries(seed.toolContents).map(([slug, data]) => [`tool-${slug}`, data])),
    },
    site: seed.siteSettings,
    ui: { en: {}, ne: {} },
    blog: [],
  });
}

/** A fresh copy of the seed defaults (used as examples of every field by the editor). */
export const seedContent = (): DevContent => init();

const g = globalThis as unknown as { __sxContent?: DevContent };
export const devContent = (): DevContent => (g.__sxContent ??= init());

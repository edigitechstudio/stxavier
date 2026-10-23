import 'server-only';
import type { ToolDestination } from '@/components/tools/types';
import { getDestinations } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import type { Locale } from '@/types/content';

/** Destinations resolved for the current locale, in the shape tool widgets need. */
export async function getToolDestinations(locale: Locale): Promise<ToolDestination[]> {
  const destinations = await getDestinations();
  return destinations.map((d) => ({
    slug: d.slug,
    name: l(d.name, locale) ?? d.slug,
    iso2: d.iso2,
    cost: d.cost_profile,
    requirements: d.requirements,
    timeline: (d.timeline ?? []).map((s) => ({ key: s.key, label: l(s.label, locale) ?? s.key, detail: l(s.detail, locale) ?? '', weeks_before: s.weeks_before })),
    documents: (d.details?.documents ?? []).map((x) => l(x, locale) ?? ''),
    universities: (d.details?.universities ?? []).map((u) => u.name),
    facts: {
      intakes: l(d.key_facts.intakes, locale) ?? null,
      work: l(d.key_facts.work_rights, locale) ?? null,
      postStudy: l(d.key_facts.post_study_visa, locale) ?? null,
      pr: l(d.key_facts.pr_pathway, locale) ?? null,
      processing: l(d.key_facts.visa_processing, locale) ?? null,
    },
  }));
}

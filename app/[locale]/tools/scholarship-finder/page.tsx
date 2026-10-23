import { ScholarshipFinder } from '@/components/tools/scholarship-finder';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { getDestinations, getPageContent, getScholarships } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';

const SLUG = 'scholarship-finder';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const locale = await currentLocale();
  const [scholarships, destinations, config] = await Promise.all([getScholarships(), getDestinations(), getPageContent('tools')]);
  return (
    <ToolPage slug={SLUG}>
      <ScholarshipFinder
        scholarships={scholarships.map((s) => ({
          id: s.id,
          name: s.name,
          provider: s.provider,
          countries: s.countries,
          levels: s.levels,
          fields: s.fields,
          min_percent: s.min_percent,
          coverage: s.coverage,
          amount: l(s.amount, locale) ?? '',
          summary: l(s.summary, locale) ?? '',
          deadline: l(s.deadline, locale) ?? null,
          url: s.url,
        }))}
        countries={destinations.map((d) => ({ value: d.slug, label: l(d.name, locale) ?? d.slug }))}
        flags={Object.fromEntries(destinations.map((d) => [d.slug, d.iso2]))}
        fields={config.fields.map((f) => ({ value: f.key, label: l(f.label, locale) ?? f.key }))}
      />
    </ToolPage>
  );
}

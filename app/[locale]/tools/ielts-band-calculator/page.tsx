import { BandCalculator } from '@/components/tools/band-calculator';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { getDestinations, getEnglishRequirements } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';

const SLUG = 'ielts-band-calculator';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const locale = await currentLocale();
  const [requirements, destinations] = await Promise.all([getEnglishRequirements(), getDestinations()]);
  return (
    <ToolPage slug={SLUG}>
      <BandCalculator
        countryNames={Object.fromEntries(destinations.map((d) => [d.slug, l(d.name, locale) ?? d.slug]))}
        requirements={requirements.map((r) => ({
          id: r.id,
          country: r.country,
          kind: r.kind,
          label: l(r.label, locale) ?? '',
          ielts_overall: r.ielts_overall,
          ielts_min_band: r.ielts_min_band,
          pte_overall: r.pte_overall,
          note: l(r.note, locale) ?? null,
          source_url: r.source_url,
        }))}
      />
    </ToolPage>
  );
}

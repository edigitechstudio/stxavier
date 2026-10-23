import { EligibilityChecker } from '@/components/tools/eligibility-checker';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { getGradingScales, getPageContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { getToolDestinations } from '@/lib/tools-data';

const SLUG = 'eligibility-checker';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const locale = await currentLocale();
  const [destinations, config, scales] = await Promise.all([getToolDestinations(locale), getPageContent('tools'), getGradingScales()]);
  const neb = scales.find((s) => s.id === 'neb') ?? scales[0];
  return (
    <ToolPage slug={SLUG}>
      <EligibilityChecker
        destinations={destinations}
        fields={config.fields.map((f) => ({ value: f.key, label: l(f.label, locale) ?? f.key }))}
        gradeBands={neb?.bands ?? []}
      />
    </ToolPage>
  );
}

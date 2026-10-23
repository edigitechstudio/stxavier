import { CostCalculator } from '@/components/tools/cost-calculator';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { currentLocale } from '@/lib/i18n/locale';
import { getExchangeRates } from '@/lib/rates';
import { getToolDestinations } from '@/lib/tools-data';

const SLUG = 'cost-calculator';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const locale = await currentLocale();
  const [destinations, rates] = await Promise.all([getToolDestinations(locale), getExchangeRates()]);
  return (
    <ToolPage slug={SLUG}>
      <CostCalculator destinations={destinations} rates={rates} />
    </ToolPage>
  );
}

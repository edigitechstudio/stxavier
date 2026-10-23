import { EmiCalculator } from '@/components/tools/emi-calculator';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { getPageContent } from '@/lib/content';

const SLUG = 'education-loan-emi-calculator';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const config = await getPageContent('tools');
  return (
    <ToolPage slug={SLUG}>
      <EmiCalculator defaults={config.loan_defaults} />
    </ToolPage>
  );
}

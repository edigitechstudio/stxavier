import { TimelinePlanner } from '@/components/tools/timeline-planner';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { currentLocale } from '@/lib/i18n/locale';
import { getToolDestinations } from '@/lib/tools-data';

const SLUG = 'visa-timeline-planner';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const locale = await currentLocale();
  const destinations = await getToolDestinations(locale);
  return (
    <ToolPage slug={SLUG}>
      <TimelinePlanner destinations={destinations} />
    </ToolPage>
  );
}

import { DocumentChecklist } from '@/components/tools/document-checklist';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { getPageContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { getToolDestinations } from '@/lib/tools-data';
import type { Level } from '@/types/tools';

const SLUG = 'document-checklist';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const locale = await currentLocale();
  const [destinations, config] = await Promise.all([getToolDestinations(locale), getPageContent('tools')]);
  const extras = Object.fromEntries(
    Object.entries(config.checklist_extras).map(([lv, items]) => [lv, (items ?? []).map((i) => l(i, locale) ?? '')]),
  ) as Partial<Record<Level, string[]>>;
  return (
    <ToolPage slug={SLUG}>
      <DocumentChecklist destinations={destinations} extras={extras} />
    </ToolPage>
  );
}

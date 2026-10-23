import { GpaConverter } from '@/components/tools/gpa-converter';
import { ToolPage, toolMetadata } from '@/components/tools/tool-page';
import { getGradingScales } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';

const SLUG = 'gpa-percentage-converter';
export const generateMetadata = () => toolMetadata(SLUG);

export default async function Page() {
  const locale = await currentLocale();
  const scales = await getGradingScales();
  return (
    <ToolPage slug={SLUG}>
      <GpaConverter
        scales={scales.map((s) => ({
          id: s.id,
          name: l(s.name, locale) ?? s.id,
          description: l(s.description, locale) ?? '',
          max_gpa: s.max_gpa,
          bands: s.bands.map((b) => ({ ...b, remark: l(b.remark, locale) ?? null })),
        }))}
      />
    </ToolPage>
  );
}

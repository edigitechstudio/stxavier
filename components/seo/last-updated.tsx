import { CalendarCheck } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

/** "Last updated" stamp — a freshness signal for answer engines. Renders a machine-readable <time>. */
export async function LastUpdated({ date }: { date: string }) {
  const [format, t] = await Promise.all([getFormatter(), getTranslations('common')]);
  return (
    <span className="inline-flex items-center gap-1.5">
      <CalendarCheck size={15} aria-hidden />
      {t('lastUpdated')}: <time dateTime={date}>{format.dateTime(new Date(date), { dateStyle: 'long' })}</time>
    </span>
  );
}

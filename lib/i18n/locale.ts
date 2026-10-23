import { hasLocale } from 'next-intl';
import { locale as rootLocale } from 'next/root-params';
import { routing, type AppLocale } from '@/i18n/routing';

/** Current request locale from the `[locale]` root param, narrowed to a supported locale. */
export async function currentLocale(): Promise<AppLocale> {
  const value = await rootLocale();
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

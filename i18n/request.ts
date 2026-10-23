import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { locale as rootLocale } from 'next/root-params';
import { loadMessages } from '@/lib/i18n/messages';
import { routing } from './routing';

export default getRequestConfig(async ({ locale: override }) => {
  // `override` is set when a locale is passed explicitly (e.g. route handlers, which can't read root params).
  const requested = override ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    timeZone: 'Asia/Kathmandu',
    // Defaults from messages/<locale>.json + any text edited in the dashboard (/admin/cms/ui).
    messages: await loadMessages(locale),
  };
});

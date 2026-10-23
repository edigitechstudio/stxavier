import { env } from '@/lib/env';
import { routing } from '@/i18n/routing';

/** Absolute URL for a locale + path ("/study-in/uk" → "https://…/en/study-in/uk"). */
export function absoluteUrl(locale: string, path = '/'): string {
  const clean = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `${env.siteUrl}/${locale}${clean}`;
}

/** hreflang map for every locale plus x-default (→ default locale). */
export function languageAlternates(path = '/'): Record<string, string> {
  const entries = routing.locales.map((loc) => [loc === 'ne' ? 'ne-NP' : 'en', absoluteUrl(loc, path)]);
  return { ...Object.fromEntries(entries), 'x-default': absoluteUrl(routing.defaultLocale, path) };
}

import type { Locale, Localized } from '@/types/content';

/** Resolve a translatable field, falling back to English when the Nepali value is missing. */
export function l<T>(value: Localized<T> | null | undefined, locale: Locale | string): T | undefined {
  if (!value) return undefined;
  if (locale === 'ne' && value.ne != null && value.ne !== '') return value.ne;
  return value.en;
}

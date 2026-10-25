import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { devContent } from '@/lib/cms/dev-store';
import { CONTENT_TAGS } from '@/lib/content';
import { isSupabaseConfigured } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';

type Messages = Record<string, unknown>;

/** Interface-text overrides edited in /admin/cms/ui (key → text), per language. */
export async function getUiOverrides(locale: string): Promise<Record<string, string>> {
  'use cache';
  cacheTag(CONTENT_TAGS.ui_text);
  cacheLife('days');
  if (!isSupabaseConfigured) return { ...devContent().ui[locale === 'ne' ? 'ne' : 'en'] };
  const { data, error } = await createPublicClient().from('ui_text').select('key, value').eq('locale', locale);
  if (error) throw new Error(`Failed to load ui_text: ${error.message}`);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export async function defaultMessages(locale: string): Promise<Messages> {
  return (await import(`../../messages/${locale === 'ne' ? 'ne' : 'en'}.json`)).default as Messages;
}

/** The defaults from messages/<locale>.json with the dashboard's overrides applied. */
export async function loadMessages(locale: string): Promise<Messages> {
  const [base, overrides] = await Promise.all([defaultMessages(locale), getUiOverrides(locale)]);
  const keys = Object.keys(overrides);
  if (!keys.length) return base;
  const merged = structuredClone(base);
  for (const key of keys) {
    const path = key.split('.');
    let node = merged as Messages;
    for (const part of path.slice(0, -1)) {
      if (typeof node[part] !== 'object' || node[part] === null) node = null as unknown as Messages;
      if (!node) break;
      node = node[part] as Messages;
    }
    // Only replace existing string entries. An override can't change the message structure.
    if (node && typeof node[path[path.length - 1]] === 'string') node[path[path.length - 1]] = overrides[key];
  }
  return merged;
}

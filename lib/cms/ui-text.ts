import 'server-only';
import { devContent } from '@/lib/cms/dev-store';
import { isSupabaseConfigured } from '@/lib/env';
import { getUiOverrides } from '@/lib/i18n/messages';
import { createSessionClient } from '@/lib/supabase/server';

export type Locale2 = 'en' | 'ne';

/** Variables like {name} or {n, plural, …} in a message — an edit must keep the same ones. */
export const placeholders = (s: string) => [...new Set([...s.matchAll(/\{\s*([A-Za-z_]\w*)/g)].map((m) => m[1]))].sort();

/** Flattens messages JSON to "namespace.key" → text. */
export function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object') Object.assign(out, flatten(v as Record<string, unknown>, key));
  }
  return out;
}

export const overridesFor = (locale: Locale2) => getUiOverrides(locale);

/** Saves overrides; `null` removes an override (back to the default text). */
export async function saveOverrides(locale: Locale2, changes: Record<string, string | null>) {
  const keys = Object.keys(changes);
  if (!keys.length) return;
  if (!isSupabaseConfigured) {
    const map = devContent().ui[locale];
    for (const k of keys) {
      if (changes[k] === null) delete map[k];
      else map[k] = changes[k]!;
    }
    return;
  }
  const db = await createSessionClient();
  const removed = keys.filter((k) => changes[k] === null);
  const upserts = keys.filter((k) => changes[k] !== null).map((k) => ({ locale, key: k, value: changes[k]! }));
  if (upserts.length) {
    const { error } = await db.from('ui_text').upsert(upserts, { onConflict: 'locale,key' });
    if (error) throw new Error(error.message);
  }
  if (removed.length) {
    const { error } = await db.from('ui_text').delete().eq('locale', locale).in('key', removed);
    if (error) throw new Error(error.message);
  }
}

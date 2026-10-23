'use server';
import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/auth/viewer';
import { collection, type Collection } from '@/lib/cms/collections';
import { deleteEntry, saveEntry } from '@/lib/cms/store';
import { flatten, overridesFor, placeholders, saveOverrides, type Locale2 } from '@/lib/cms/ui-text';
import { CONTENT_TAGS } from '@/lib/content';
import { defaultMessages } from '@/lib/i18n/messages';

/** Content editing is for admins only; every action re-checks. */
async function admin() {
  const v = await getViewer();
  if (v?.role !== 'admin') throw new Error('Admins only');
  return v;
}

/** Cache tags to refresh so an edit shows on the site immediately. */
function publish(c: Collection) {
  if (c.kind === 'site') updateTag(CONTENT_TAGS.site_settings);
  else if (c.kind === 'pages') updateTag(CONTENT_TAGS.page_content);
  else if (c.kind === 'blog') updateTag('blog');
  else updateTag(CONTENT_TAGS[c.table!]);
}

export type SaveState = { errors?: string[]; saved?: boolean };

export async function saveEntryAction(_prev: SaveState, form: FormData): Promise<SaveState> {
  await admin();
  const c = collection(String(form.get('collection')));
  if (!c) return { errors: ['Unknown collection'] };
  const id = String(form.get('id') ?? '') || null;
  let value: unknown;
  try {
    value = JSON.parse(String(form.get('json') ?? ''));
  } catch {
    return { errors: ['The form data could not be read. Reload and try again.'] };
  }
  const res = await saveEntry(c, id, value);
  if (!res.ok) return { errors: res.errors };
  publish(c);
  if (!id) redirect(`/admin/cms/${c.key}/${encodeURIComponent(res.id)}?saved=1`);
  refresh();
  return { saved: true };
}

export async function deleteEntryAction(form: FormData) {
  await admin();
  const c = collection(String(form.get('collection')));
  if (!c) throw new Error('Unknown collection');
  const res = await deleteEntry(c, String(form.get('id')));
  if (!res.ok) redirect(`/admin/cms/${c.key}?error=${encodeURIComponent(res.error ?? 'Could not delete')}`);
  publish(c);
  redirect(`/admin/cms/${c.key}?deleted=1`);
}

/** Saves the interface text of one group (namespace) in both languages. */
export async function saveUiTextAction(_prev: SaveState, form: FormData): Promise<SaveState> {
  await admin();
  const ns = String(form.get('ns'));
  const errors: string[] = [];
  for (const locale of ['en', 'ne'] as Locale2[]) {
    const defaults = flatten(await defaultMessages(locale));
    const current = await overridesFor(locale);
    const changes: Record<string, string | null> = {};
    for (const [field, raw] of form.entries()) {
      if (!field.startsWith(`${locale}:`)) continue;
      const key = field.slice(locale.length + 1);
      // ns "*" = a search result spanning several groups.
      if ((ns !== '*' && !key.startsWith(`${ns}.`)) || !(key in defaults)) continue;
      const value = String(raw).replace(/\r\n/g, '\n');
      const isDefault = value.trim() === '' || value === defaults[key];
      if (isDefault) {
        if (key in current) changes[key] = null;
        continue;
      }
      const need = placeholders(defaults[key]);
      const have = placeholders(value);
      if (need.join() !== have.join()) {
        errors.push(`${key} (${locale}): keep exactly these variables: ${need.length ? need.map((p) => `{${p}}`).join(' ') : 'none'}`);
        continue;
      }
      if (current[key] !== value) changes[key] = value;
    }
    await saveOverrides(locale, changes);
  }
  updateTag(CONTENT_TAGS.ui_text);
  refresh();
  return errors.length ? { errors } : { saved: true };
}

import 'server-only';
import { blogRows, fileSlugs, filePostAsRow } from '@/lib/blog';
import { isSupabaseConfigured } from '@/lib/env';
import { createSessionClient } from '@/lib/supabase/server';
import { BLOG_TOPICS } from '@/types/trust';
import type { Collection } from './collections';
import { devContent, seedContent, type BlogRow } from './dev-store';
import { complete, conform, nullablePaths, sampleOf, suggestionsFrom, titleOf } from './shape';

/**
 * Read/write layer for /admin/cms. Supabase when configured (admin RLS policies apply — the
 * session client is used), otherwise the in-memory development copy. Callers check the role.
 */
type Row = Record<string, unknown>;
export type EntrySummary = { id: string; title: string; published?: boolean; placeholder?: boolean; sort?: number; note?: string };

const dbErr = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

/** A representative blog post: gives the editor every field and its type. */
const BLOG_EXAMPLE: BlogRow = {
  slug: 'example',
  title: { en: '', ne: '' },
  description: { en: '', ne: '' },
  body: { en: '## Heading\n\nText…', ne: '' },
  topic: BLOG_TOPICS[0],
  countries: [''],
  levels: [''],
  cover: '',
  author: 'editorial',
  date: '2026-01-01',
  updated: '2026-01-01',
  draft: false,
  needs_review: false,
};

// ---------------------------------------------------------------------------- reads

async function tableRows(c: Collection): Promise<Row[]> {
  if (!isSupabaseConfigured) return (devContent().rows[c.table!] ?? []) as Row[];
  const db = await createSessionClient();
  const { data, error } = await db.from(c.table!).select('*');
  dbErr(error);
  return data as Row[];
}

async function pageRows(): Promise<{ id: string; data: unknown }[]> {
  if (!isSupabaseConfigured) return Object.entries(devContent().pages).map(([id, data]) => ({ id, data }));
  const db = await createSessionClient();
  const { data, error } = await db.from('page_content').select('id, data');
  dbErr(error);
  return data as { id: string; data: unknown }[];
}

async function siteData(): Promise<unknown> {
  if (!isSupabaseConfigured) return devContent().site;
  const db = await createSessionClient();
  const { data, error } = await db.from('site_settings').select('data').eq('id', 'main').maybeSingle();
  dbErr(error);
  return data?.data ?? seedContent().site;
}

export async function listEntries(c: Collection): Promise<EntrySummary[]> {
  if (c.kind === 'site') return [{ id: 'main', title: 'Site settings' }];
  if (c.kind === 'pages') return (await pageRows()).map((p) => ({ id: p.id, title: p.id }));
  if (c.kind === 'blog') {
    const [rows, files] = await Promise.all([blogRows(), fileSlugs()]);
    const db = rows.map((r) => ({ id: r.slug, title: r.title.en, published: !r.draft, note: r.date }));
    const fromFiles = files.filter((s) => !rows.some((r) => r.slug === s)).map((s) => ({ id: s, title: s.replace(/-/g, ' '), published: true, note: 'file (edit to manage here)' }));
    return [...db, ...fromFiles];
  }
  return (await tableRows(c))
    .map((r) => ({
      id: String(r[c.pk]),
      title: titleOf(r, String(r[c.pk])),
      published: typeof r.published === 'boolean' ? r.published : undefined,
      placeholder: typeof r.is_placeholder === 'boolean' ? r.is_placeholder : undefined,
      sort: typeof r.sort === 'number' ? r.sort : undefined,
    }))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.title.localeCompare(b.title));
}

export async function getEntry(c: Collection, id: string): Promise<unknown | null> {
  if (c.kind === 'site') return siteData();
  if (c.kind === 'pages') return (await pageRows()).find((p) => p.id === id)?.data ?? null;
  if (c.kind === 'blog') return (await blogRows()).find((r) => r.slug === id) ?? (await filePostAsRow(id));
  return (await tableRows(c)).find((r) => String(r[c.pk]) === id) ?? null;
}

/** Examples the editor uses to know every field and its type (current data + the seed defaults). */
export async function shapeFor(c: Collection, id: string | null): Promise<{ sample: unknown; nullable: string[]; suggestions: Record<string, string[]> }> {
  const seed = seedContent();
  let examples: unknown[];
  if (c.kind === 'site') examples = [await siteData(), seed.site];
  else if (c.kind === 'pages') examples = [id ? await getEntry(c, id) : null, id ? seed.pages[id] : null].filter(Boolean);
  // Second example marks cover/updated as optional while the first gives their types.
  else if (c.kind === 'blog') examples = [BLOG_EXAMPLE, { ...BLOG_EXAMPLE, cover: null, updated: null }, ...(await blogRows())];
  else examples = [...(await tableRows(c)), ...((seed.rows[c.table!] ?? []) as Row[])];
  return { sample: sampleOf(examples), nullable: nullablePaths(examples), suggestions: suggestionsFrom(examples) };
}

// ---------------------------------------------------------------------------- writes

const ID = /^[a-z0-9][a-z0-9_-]{0,99}$/;

export async function saveEntry(c: Collection, id: string | null, input: unknown): Promise<{ ok: true; id: string } | { ok: false; errors: string[] }> {
  const { sample, nullable } = await shapeFor(c, id);
  const set = new Set(nullable);
  const value = complete(input, sample, set) as Row;
  const errors = conform(value, sample, set);
  if (errors.length) return { ok: false, errors: errors.slice(0, 12) };

  if (c.kind === 'site') {
    if (!isSupabaseConfigured) devContent().site = value;
    else dbErr((await (await createSessionClient()).from('site_settings').upsert({ id: 'main', data: value })).error);
    return { ok: true, id: 'main' };
  }
  if (c.kind === 'pages') {
    if (!id) return { ok: false, errors: ['Unknown page'] };
    if (!isSupabaseConfigured) devContent().pages[id] = value;
    else dbErr((await (await createSessionClient()).from('page_content').upsert({ id, data: value })).error);
    return { ok: true, id };
  }

  const key = String(value[c.pk] ?? '').trim();
  if (!ID.test(key)) return { ok: false, errors: [`${c.pk} must use lowercase letters, numbers and hyphens`] };
  if (id && key !== id) return { ok: false, errors: [`${c.pk} can't be changed — create a new entry instead`] };
  if (!id) {
    const exists = c.kind === 'blog' ? (await blogRows()).some((r) => r.slug === key) || (await fileSlugs()).includes(key) : (await tableRows(c)).some((r) => String(r[c.pk]) === key);
    if (exists) return { ok: false, errors: [`An entry with ${c.pk} "${key}" already exists`] };
  }
  if ('updated_at' in value) value.updated_at = new Date().toISOString();

  if (c.kind === 'blog') {
    const row = value as unknown as BlogRow;
    if (!isSupabaseConfigured) {
      const list = devContent().blog;
      const i = list.findIndex((r) => r.slug === key);
      if (i >= 0) list[i] = row;
      else list.push(row);
    } else dbErr((await (await createSessionClient()).from('blog_posts').upsert(row)).error);
    return { ok: true, id: key };
  }

  if (!isSupabaseConfigured) {
    const list = (devContent().rows[c.table!] ??= []);
    const i = list.findIndex((r) => String(r[c.pk]) === key);
    if (i >= 0) list[i] = value;
    else list.push(value);
  } else {
    const { error } = await (await createSessionClient()).from(c.table!).upsert(value, { onConflict: c.pk });
    if (error) return { ok: false, errors: [error.message] };
  }
  return { ok: true, id: key };
}

export async function deleteEntry(c: Collection, id: string): Promise<{ ok: boolean; error?: string }> {
  if (!c.creatable) return { ok: false, error: 'This entry cannot be deleted.' };
  if (c.kind === 'blog') {
    if (!isSupabaseConfigured) devContent().blog = devContent().blog.filter((r) => r.slug !== id);
    else dbErr((await (await createSessionClient()).from('blog_posts').delete().eq('slug', id)).error);
    return { ok: true };
  }
  if (!isSupabaseConfigured) {
    const rows = devContent().rows;
    rows[c.table!] = (rows[c.table!] ?? []).filter((r) => String(r[c.pk]) !== id);
    return { ok: true };
  }
  const { error } = await (await createSessionClient()).from(c.table!).delete().eq(c.pk, id);
  // e.g. a counsellor referenced by bookings — explain instead of failing silently.
  return error ? { ok: false, error: error.code === '23503' ? 'Other records still use this entry. Unpublish it instead.' : error.message } : { ok: true };
}

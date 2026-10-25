import 'server-only';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import GithubSlugger from 'github-slugger';
import matter from 'gray-matter';
import { cacheLife, cacheTag } from 'next/cache';
import { devContent, type BlogRow } from '@/lib/cms/dev-store';
import { env, isSupabaseConfigured } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';
import type { BlogFrontmatter, BlogPostMeta } from '@/types/trust';

/**
 * Blog repository. Two sources, merged by slug:
 *   - Posts written in the dashboard (/admin/cms/blog → table blog_posts). These win.
 *   - MDX files in content/blog: <slug>.mdx (English) and optional <slug>.ne.mdx (Nepali).
 * Pages only use listPosts / getPost.
 */

const DIR = path.join(process.cwd(), 'content', 'blog');
const WORDS_PER_MINUTE = 200;

function analyse(body: string) {
  const slugger = new GithubSlugger();
  const headings: BlogPostMeta['headings'] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (m) {
      const text = m[2].replace(/[*_`[\]]/g, '').trim();
      headings.push({ id: slugger.slug(text), text, depth: m[1].length as 2 | 3 });
    }
  }
  const words = body.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  return { headings, readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) };
}

async function readPost(slug: string, locale: string): Promise<{ meta: BlogPostMeta; body: string } | null> {
  const candidates = locale === 'en' ? [`${slug}.mdx`] : [`${slug}.${locale}.mdx`, `${slug}.mdx`];
  for (const file of candidates) {
    try {
      const raw = await readFile(path.join(DIR, file), 'utf8');
      const { data, content } = matter(raw);
      const fm = data as BlogFrontmatter;
      const date = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : (v as string | undefined));
      const meta: BlogPostMeta = {
        ...fm,
        date: date(fm.date) ?? '',
        updated: date(fm.updated),
        slug,
        source: 'file',
        locale: file.endsWith(`.${locale}.mdx`) ? locale : 'en',
        ...analyse(content),
      };
      return { meta, body: content };
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/** All published posts for a locale, newest first. Drafts appear only in development. */
/** Posts written in the dashboard (drafts included, callers filter). */
export async function blogRows(): Promise<BlogRow[]> {
  if (!isSupabaseConfigured) return devContent().blog;
  const { data, error } = await createPublicClient().from('blog_posts').select('*');
  if (error) throw new Error(`Failed to load blog_posts: ${error.message}`);
  return data as BlogRow[];
}

function fromRow(r: BlogRow, locale: string): { meta: BlogPostMeta; body: string } {
  const useNe = locale === 'ne' && !!r.body.ne?.trim();
  const pick = (v: { en: string; ne?: string | null }) => (useNe && v.ne?.trim() ? v.ne : v.en);
  const body = pick(r.body);
  return {
    meta: {
      title: pick(r.title),
      description: pick(r.description),
      date: String(r.date).slice(0, 10),
      updated: r.updated ? String(r.updated).slice(0, 10) : undefined,
      author: r.author,
      topic: r.topic as BlogPostMeta['topic'],
      countries: r.countries,
      levels: r.levels,
      cover: r.cover ?? undefined,
      draft: r.draft,
      needs_review: r.needs_review,
      slug: r.slug,
      locale: useNe ? 'ne' : 'en',
      source: 'db',
      ...analyse(body),
    },
    body,
  };
}

/** Slugs of the MDX files in content/blog. */
export async function fileSlugs(): Promise<string[]> {
  let files: string[] = [];
  try {
    files = await readdir(DIR);
  } catch {
    return [];
  }
  return [...new Set(files.filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/(\.[a-z]{2})?\.mdx$/, '')))];
}

/** A file-based post as editable fields (used when a file post is first edited in the dashboard). */
export async function filePostAsRow(slug: string): Promise<BlogRow | null> {
  const [en, ne] = await Promise.all([readPost(slug, 'en'), readPost(slug, 'ne')]);
  if (!en) return null;
  const neOwn = ne && ne.meta.locale === 'ne' ? ne : null;
  const m = en.meta;
  return {
    slug,
    title: { en: m.title, ne: neOwn?.meta.title ?? null },
    description: { en: m.description, ne: neOwn?.meta.description ?? null },
    body: { en: en.body.trim(), ne: neOwn?.body.trim() ?? null },
    topic: m.topic,
    countries: m.countries ?? [],
    levels: m.levels ?? [],
    cover: m.cover ?? null,
    author: m.author,
    date: m.date,
    updated: m.updated ?? null,
    draft: !!m.draft,
    needs_review: !!m.needs_review,
  };
}

export async function listPosts(locale: string): Promise<BlogPostMeta[]> {
  'use cache';
  cacheTag('blog');
  cacheLife('days');
  const [slugs, rows] = await Promise.all([fileSlugs(), blogRows()]);
  const fromDb = rows.map((r) => fromRow(r, locale).meta);
  const dbSlugs = new Set(fromDb.map((p) => p.slug));
  const fromFiles = (await Promise.all(slugs.filter((s) => !dbSlugs.has(s)).map((s) => readPost(s, locale)))).filter((p) => p !== null).map((p) => p.meta);
  return [...fromDb, ...fromFiles].filter((p) => !(p.draft && env.isProduction)).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string, locale: string) {
  'use cache';
  cacheTag('blog');
  cacheLife('days');
  const row = (await blogRows()).find((r) => r.slug === slug);
  const post = row ? fromRow(row, locale) : await readPost(slug, locale);
  if (!post || (post.meta.draft && env.isProduction)) return null;
  return post;
}

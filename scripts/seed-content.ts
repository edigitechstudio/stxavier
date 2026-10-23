/**
 * Loads the starter content (data/seed + the MDX posts in content/blog) into Supabase.
 * Run once after applying the migrations, then edit everything in /admin/cms.
 *
 *   npm run seed              # adds only what is missing — never overwrites dashboard edits
 *   npm run seed -- --force   # resets every row to the seed version (destroys edits!)
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import * as seed from '../data/seed';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const FORCE = process.argv.includes('--force');

async function upsert(table: string, rows: object[], onConflict: string) {
  // Without --force existing rows are left alone, so re-running never undoes dashboard edits.
  const { error } = await db.from(table).upsert(rows, { onConflict, ignoreDuplicates: !FORCE });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`✓ ${table} (${rows.length}${FORCE ? ', overwritten' : ', missing rows added'})`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const strip = <T extends object>(row: T) => (({ children, flag, ...rest }: T & { children?: unknown; flag?: unknown }) => rest)(row);

async function main() {
  await upsert('site_settings', [{ id: 'main', data: seed.siteSettings }], 'id');
  await upsert('offices', seed.offices, 'id');
  await upsert('destinations', seed.destinations, 'slug');
  await upsert('services', seed.services, 'slug');
  await upsert('test_prep_courses', seed.testPrepCourses, 'slug');
  await upsert('stats', seed.stats, 'key');
  await upsert('faqs', seed.faqs, 'id');
  await upsert('accreditations', seed.accreditations, 'id');
  await upsert(
    'page_content',
    [{ id: 'home', data: seed.homeContent }, ...Object.entries(seed.pages).map(([id, data]) => ({ id, data }))],
    'id',
  );
  await upsert('counsellors', seed.counsellors, 'slug');
  await upsert('scholarships', seed.scholarships, 'id');
  await upsert('english_requirements', seed.englishRequirements, 'id');
  await upsert('grading_scales', seed.gradingScales, 'id');
  await upsert('universities', seed.universities, 'slug');
  await upsert('events', seed.events, 'slug');
  await upsert(
    'page_content',
    Object.entries(seed.toolContents).map(([slug, data]) => ({ id: `tool-${slug}`, data })),
    'id',
  );
  await upsert('features', seed.features, 'id');
  await upsert('testimonials', seed.testimonials, 'id');
  await upsert('partners', seed.partners, 'id');
  await upsert('counsellor_availability', seed.availability.map(({ start, end, ...r }) => ({ ...r, start_time: start, end_time: end })), 'id');
  await upsert('availability_exceptions', seed.availabilityExceptions.map(({ start, end, ...r }) => ({ ...r, start_time: start, end_time: end })), 'id');
  // Parents before children (self-referencing foreign key).
  const nav = seed.navItems.map(strip);
  await upsert('nav_items', nav.filter((n) => !n.parent_id), 'id');
  await upsert('nav_items', nav.filter((n) => n.parent_id), 'id');
  await upsert('blog_posts', await blogPosts(), 'slug');
  console.log('Seed complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/** The MDX posts in content/blog as editable blog_posts rows (English + optional Nepali file). */
async function blogPosts() {
  const dir = path.join(process.cwd(), 'content', 'blog');
  const files = (await readdir(dir).catch(() => [] as string[])).filter((f) => f.endsWith('.mdx'));
  const slugs = [...new Set(files.map((f) => f.replace(/(\.[a-z]{2})?\.mdx$/, '')))];
  const read = async (file: string) => (files.includes(file) ? matter(await readFile(path.join(dir, file), 'utf8')) : null);
  const day = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : (v as string | undefined) ?? null);
  return Promise.all(
    slugs.map(async (slug) => {
      const en = (await read(`${slug}.mdx`))!;
      const ne = await read(`${slug}.ne.mdx`);
      const d = en.data;
      return {
        slug,
        title: { en: d.title, ne: ne?.data.title ?? null },
        description: { en: d.description, ne: ne?.data.description ?? null },
        body: { en: en.content.trim(), ne: ne?.content.trim() ?? null },
        topic: d.topic,
        countries: d.countries ?? [],
        levels: d.levels ?? [],
        cover: d.cover ?? null,
        author: d.author ?? 'editorial',
        date: day(d.date),
        updated: day(d.updated),
        draft: !!d.draft,
        needs_review: !!d.needs_review,
      };
    }),
  );
}

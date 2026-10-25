import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { env, isSupabaseConfigured } from '@/lib/env';
import { createPublicClient } from '@/lib/supabase/public';
import { devContent } from '@/lib/cms/dev-store';
import { devAvailability } from '@/lib/booking/dev-availability';
import type {
  Accreditation,
  Counsellor,
  Destination,
  Faq,
  Feature,
  FeatureGroup,
  HomeContent,
  NavItem,
  Office,
  PageContentMap,
  PageId,
  Partner,
  Service,
  SiteSettings,
  Stat,
  TestPrepCourse,
  Testimonial,
} from '@/types/content';
import type { EnglishRequirement, GradingScale, Scholarship, ToolContent } from '@/types/tools';
import type { SiteEvent, University } from '@/types/trust';
import type { AvailabilityException, AvailabilityRule } from '@/types/booking';

/**
 * Content repository, the only place pages read business content from.
 *
 * Source: Supabase when configured, otherwise the typed seed files in `data/seed`.
 * Caching: every reader is `'use cache'` + tagged. Editing a row in Supabase triggers
 * `/api/revalidate` (DB webhook or admin dashboard), which calls `revalidateTag` for that table,
 * so changes go live without a redeploy.
 */

export const CONTENT_TAGS = {
  site_settings: 'content:site_settings',
  offices: 'content:offices',
  nav_items: 'content:nav_items',
  destinations: 'content:destinations',
  services: 'content:services',
  test_prep_courses: 'content:test_prep_courses',
  stats: 'content:stats',
  faqs: 'content:faqs',
  accreditations: 'content:accreditations',
  page_content: 'content:page_content',
  features: 'content:features',
  testimonials: 'content:testimonials',
  partners: 'content:partners',
  counsellors: 'content:counsellors',
  scholarships: 'content:scholarships',
  english_requirements: 'content:english_requirements',
  grading_scales: 'content:grading_scales',
  universities: 'content:universities',
  events: 'content:events',
  counsellor_availability: 'content:counsellor_availability',
  availability_exceptions: 'content:availability_exceptions',
  ui_text: 'content:ui_text',
  blog_posts: 'blog',
} as const;

export type ContentTable = keyof typeof CONTENT_TAGS;

async function readTable<T>(table: ContentTable, publishedOnly = false): Promise<T[]> {
  if (!isSupabaseConfigured) {
    // Local development: the editable in-memory copy of data/seed (see lib/cms/dev-store).
    const rows = (devContent().rows[table] ?? []) as (T & { published?: boolean })[];
    return publishedOnly ? rows.filter((r) => r.published !== false) : rows;
  }
  let query = createPublicClient().from(table).select('*');
  if (publishedOnly) query = query.eq('published', true);
  const { data, error } = await query.order('sort', { ascending: true });
  // Fail loudly rather than silently serving placeholder seed content in production.
  if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
  return data as T[];
}

const bySort = <T extends { sort: number }>(rows: T[]) => [...rows].sort((a, b) => a.sort - b.sort);

/** Sample/unverified rows are shown (with a TODO badge) in development and never in production. */
const verifiedInProd = <T extends { is_placeholder: boolean }>(rows: T[]) =>
  env.isProduction ? rows.filter((r) => !r.is_placeholder) : rows;

export async function getSiteSettings(): Promise<SiteSettings> {
  'use cache';
  cacheTag(CONTENT_TAGS.site_settings);
  cacheLife('days');
  if (!isSupabaseConfigured) return devContent().site as SiteSettings;
  const { data, error } = await createPublicClient().from('site_settings').select('data').eq('id', 'main').single();
  if (error) throw new Error(`Failed to load site_settings: ${error.message}`);
  return data.data as SiteSettings;
}

export async function getOffices(): Promise<Office[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.offices);
  cacheLife('days');
  return bySort(await readTable<Office>('offices'));
}

export async function getHeadOffice(): Promise<Office | undefined> {
  const offices = await getOffices();
  return offices.find((o) => o.is_head_office) ?? offices[0];
}

export async function getDestinations(): Promise<Destination[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.destinations);
  cacheLife('days');
  return bySort(await readTable<Destination>('destinations', true));
}

export async function getDestination(slug: string): Promise<Destination | undefined> {
  return (await getDestinations()).find((d) => d.slug === slug);
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find((x) => x.slug === slug);
}

export async function getTestPrepCourse(slug: string): Promise<TestPrepCourse | undefined> {
  return (await getTestPrepCourses()).find((x) => x.slug === slug);
}

export async function getCounsellors(): Promise<Counsellor[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.counsellors);
  cacheLife('days');
  return verifiedInProd(bySort(await readTable<Counsellor>('counsellors', true)));
}

export async function getCounsellor(slug: string): Promise<Counsellor | undefined> {
  return (await getCounsellors()).find((c) => c.slug === slug);
}

export async function getServices(): Promise<Service[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.services);
  cacheLife('days');
  return bySort(await readTable<Service>('services', true));
}

export async function getTestPrepCourses(): Promise<TestPrepCourse[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.test_prep_courses);
  cacheLife('days');
  return bySort(
    await readTable<TestPrepCourse>('test_prep_courses', true),
  );
}

export async function getStats(): Promise<Stat[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.stats);
  cacheLife('days');
  return verifiedInProd(bySort(await readTable<Stat>('stats')));
}

export async function getFaqs(scope?: string): Promise<Faq[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.faqs);
  cacheLife('days');
  const rows = bySort(await readTable<Faq>('faqs', true));
  return scope ? rows.filter((f) => f.scope === scope) : rows;
}

export async function getAccreditations(): Promise<Accreditation[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.accreditations);
  cacheLife('days');
  return verifiedInProd(bySort(await readTable<Accreditation>('accreditations')));
}

/** Editable copy for a page (one `page_content` row per page). */
export async function getPageContent<K extends PageId>(id: K): Promise<PageContentMap[K]> {
  'use cache';
  cacheTag(CONTENT_TAGS.page_content);
  cacheLife('days');
  if (!isSupabaseConfigured) return devContent().pages[id] as PageContentMap[K];
  const { data, error } = await createPublicClient().from('page_content').select('data').eq('id', id).single();
  if (error) throw new Error(`Failed to load page_content/${id}: ${error.message}`);
  return data.data as PageContentMap[K];
}

export const getHomeContent = (): Promise<HomeContent> => getPageContent('home');

export async function getFeatures(group: FeatureGroup): Promise<Feature[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.features);
  cacheLife('days');
  const rows = await readTable<Feature>('features', true);
  return bySort(rows.filter((x) => x.group === group));
}

export async function getTestimonials(kind: Testimonial['kind']): Promise<Testimonial[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.testimonials);
  cacheLife('days');
  const rows = await readTable<Testimonial>('testimonials', true);
  return verifiedInProd(bySort(rows.filter((x) => x.kind === kind)));
}

export async function getPartners(): Promise<Partner[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.partners);
  cacheLife('days');
  return verifiedInProd(bySort(await readTable<Partner>('partners', true)));
}

/** Menu tree with collection-driven children (destinations, services, test prep) resolved. */
export async function getNavigation(menu: NavItem['menu']): Promise<NavItem[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.nav_items, CONTENT_TAGS.destinations, CONTENT_TAGS.services, CONTENT_TAGS.test_prep_courses);
  cacheLife('days');

  const items = (await readTable<NavItem>('nav_items')).filter((i) => i.menu === menu);
  const [destinations, services, courses] = await Promise.all([
    getDestinations(),
    getServices(),
    getTestPrepCourses(),
  ]);

  const fromSource = (item: NavItem): NavItem[] => {
    const base = { menu, parent_id: item.id, source: null } as const;
    switch (item.source) {
      case 'destinations':
        return destinations.map((d) => ({
          ...base, id: `dest-${d.slug}`, label: d.name, description: d.summary,
          href: `/study-in/${d.slug}`, icon: null, flag: d.iso2, sort: d.sort,
        }));
      case 'services':
        return services.map((s) => ({
          ...base, id: `svc-${s.slug}`, label: s.title, description: s.summary,
          href: `/services/${s.slug}`, icon: s.icon, sort: s.sort,
        }));
      case 'test_prep':
        return courses.map((c) => ({
          ...base, id: `prep-${c.slug}`, label: c.name, description: c.summary,
          href: `/test-prep/${c.slug}`, icon: c.icon, sort: c.sort,
        }));
      default:
        return [];
    }
  };

  const roots = bySort(items.filter((i) => !i.parent_id));
  return roots.map((root) => ({
    ...root,
    children: root.source ? fromSource(root) : bySort(items.filter((i) => i.parent_id === root.id)),
  }));
}

// ---------------------------------------------------------------------------
// Tools (Phase 3)
// ---------------------------------------------------------------------------

export async function getScholarships(): Promise<Scholarship[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.scholarships);
  cacheLife('days');
  return bySort(await readTable<Scholarship>('scholarships', true));
}

export async function getEnglishRequirements(): Promise<EnglishRequirement[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.english_requirements);
  cacheLife('days');
  return bySort(await readTable<EnglishRequirement>('english_requirements', true));
}

export async function getGradingScales(): Promise<GradingScale[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.grading_scales);
  cacheLife('days');
  return bySort(await readTable<GradingScale>('grading_scales'));
}

/** Editable copy for a tool page (page_content row "tool-<slug>"). */
export async function getToolContent(slug: string): Promise<ToolContent | undefined> {
  'use cache';
  cacheTag(CONTENT_TAGS.page_content);
  cacheLife('days');
  if (!isSupabaseConfigured) return devContent().pages[`tool-${slug}`] as ToolContent | undefined;
  const { data, error } = await createPublicClient().from('page_content').select('data').eq('id', `tool-${slug}`).maybeSingle();
  if (error) throw new Error(`Failed to load tool content ${slug}: ${error.message}`);
  return (data?.data as ToolContent | undefined) ?? undefined;
}

// ---------------------------------------------------------------------------
// Trust & content (Phase 4)
// ---------------------------------------------------------------------------

export async function getUniversities(): Promise<University[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.universities);
  cacheLife('days');
  return verifiedInProd(bySort(await readTable<University>('universities', true)));
}

export async function getUniversity(slug: string): Promise<University | undefined> {
  return (await getUniversities()).find((u) => u.slug === slug);
}

export async function getEvents(): Promise<SiteEvent[]> {
  'use cache';
  cacheTag(CONTENT_TAGS.events);
  cacheLife('days');
  let rows: SiteEvent[];
  if (!isSupabaseConfigured) rows = (devContent().rows.events as unknown as SiteEvent[]).filter((e) => e.published);
  else {
    const { data, error } = await createPublicClient().from('events').select('*').eq('published', true).order('starts_at');
    if (error) throw new Error(`Failed to load events: ${error.message}`);
    rows = data as SiteEvent[];
  }
  return verifiedInProd([...rows].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
}

export async function getEvent(slug: string): Promise<SiteEvent | undefined> {
  return (await getEvents()).find((e) => e.slug === slug);
}

/**
 * Current time for "upcoming vs past" splits. Cached for an hour so pages stay static while
 * events still roll over from upcoming to past without a deploy.
 */
export async function getNowIso(): Promise<string> {
  'use cache';
  cacheTag('clock');
  cacheLife('hours');
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Booking (Phase 5): availability is content; bookings themselves are never cached.
// ---------------------------------------------------------------------------

export async function getAvailability(): Promise<{ rules: AvailabilityRule[]; exceptions: AvailabilityException[] }> {
  'use cache';
  cacheTag(CONTENT_TAGS.counsellor_availability, CONTENT_TAGS.availability_exceptions);
  cacheLife('hours');
  if (!isSupabaseConfigured) {
    const dev = devAvailability();
    return { rules: [...dev.rules], exceptions: [...dev.exceptions] };
  }
  const db = createPublicClient();
  const [r, e] = await Promise.all([db.from('counsellor_availability').select('*'), db.from('availability_exceptions').select('*')]);
  if (r.error) throw new Error(`Failed to load availability: ${r.error.message}`);
  if (e.error) throw new Error(`Failed to load exceptions: ${e.error.message}`);
  const hm = (t: string | null) => (t ? t.slice(0, 5) : null);
  type Row = Record<string, unknown> & { start_time: string | null; end_time: string | null };
  return {
    rules: (r.data as Row[]).map(({ start_time, end_time, ...rest }) => ({ ...rest, start: hm(start_time)!, end: hm(end_time)! }) as AvailabilityRule),
    exceptions: (e.data as Row[]).map(({ start_time, end_time, ...rest }) => ({ ...rest, start: hm(start_time), end: hm(end_time) }) as AvailabilityException),
  };
}

import 'server-only';
import type { MetadataRoute } from 'next';
import { listPosts } from '@/lib/blog';
import { getCounsellors, getDestinations, getEvents, getNavigation, getServices, getTestPrepCourses, getUniversities } from '@/lib/content';
import { BLOG_TOPICS } from '@/types/trust';

type Entry = { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number; lastModified?: string };

/**
 * Every public, indexable route. Collections expand from the content layer, so a destination,
 * course, service or counsellor published in the CMS appears in the sitemap automatically.
 */
export async function publicRoutes(): Promise<Entry[]> {
  const [destinations, courses, services, team, nav, universities, posts, events] = await Promise.all([
    getDestinations(),
    getTestPrepCourses(),
    getServices(),
    getCounsellors(), // placeholder profiles are already excluded in production
    getNavigation('header'),
    getUniversities(),
    listPosts('en'),
    getEvents(), // sample events are already excluded in production
  ]);
  const topics = BLOG_TOPICS.filter((t) => posts.some((p) => p.topic === t));
  const tools = (nav.find((n) => n.id === 'tools')?.children ?? []).filter((t) => t.href?.startsWith('/tools/'));

  return [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/destinations', changeFrequency: 'monthly', priority: 0.9 },
    ...destinations.map((d) => ({ path: `/study-in/${d.slug}`, changeFrequency: 'monthly' as const, priority: 0.9, lastModified: d.updated_at })),
    { path: '/test-prep', changeFrequency: 'monthly', priority: 0.8 },
    ...courses.map((c) => ({ path: `/test-prep/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { path: '/services', changeFrequency: 'monthly', priority: 0.7 },
    ...services.map((s) => ({ path: `/services/${s.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    { path: '/about', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/team', changeFrequency: 'monthly', priority: 0.6 },
    ...team.filter((c) => !c.is_placeholder).map((c) => ({ path: `/team/${c.slug}`, changeFrequency: 'yearly' as const, priority: 0.4 })),
    { path: '/for-parents', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.7 },
    { path: '/book', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/enquiry', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/cookie-policy', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/editorial-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/tools', changeFrequency: 'monthly', priority: 0.8 },
    ...tools.map((t) => ({ path: t.href!, changeFrequency: 'monthly' as const, priority: 0.7 })),
    { path: '/universities', changeFrequency: 'weekly', priority: 0.8 },
    ...universities.map((u) => ({ path: `/universities/${u.slug}`, changeFrequency: 'monthly' as const, priority: 0.6, lastModified: u.updated_at })),
    { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
    ...topics.map((t) => ({ path: `/blog/topic/${t}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7, lastModified: p.updated ?? p.date })),
    { path: '/events', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/webinars', changeFrequency: 'weekly', priority: 0.5 },
    ...events.filter((e) => !e.is_placeholder).map((e) => ({ path: `/events/${e.slug}`, changeFrequency: 'weekly' as const, priority: 0.5 })),
    { path: '/success-stories', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  ];
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageHero } from '@/components/sx/page-hero';
import { SiteSearch, type SearchDoc } from '@/components/trust/site-search';
import { listPosts } from '@/lib/blog';
import { getDestinations, getFaqs, getNavigation, getServices, getTestPrepCourses, getUniversities } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/search', title: t('search'), description: t('faqDesc'), noindex: true });
}

/** Builds the search index from live content at render time (cached like every content read). */
export default async function SearchPage() {
  const locale = await currentLocale();
  const [destinations, universities, posts, faqs, nav, services, courses, tm] = await Promise.all([
    getDestinations(),
    getUniversities(),
    listPosts(locale),
    getFaqs(),
    getNavigation('header'),
    getServices(),
    getTestPrepCourses(),
    getTranslations('meta'),
  ]);
  const loc = (v: Parameters<typeof l>[0]) => (l(v, locale) as string | undefined) ?? '';

  const docs: SearchDoc[] = [
    ...destinations.map((d) => ({ type: 'destination' as const, title: tm('studyIn', { country: loc(d.name) }), text: `${loc(d.summary)} ${loc(d.details?.intro)}`, href: `/study-in/${d.slug}` })),
    ...universities.map((u) => ({ type: 'university' as const, title: u.name, text: `${u.city} · ${u.popular_courses.map(loc).join(', ')}`, href: `/universities/${u.slug}` })),
    ...posts.map((p) => ({ type: 'post' as const, title: p.title, text: p.description, href: `/blog/${p.slug}` })),
    ...faqs.map((f) => ({ type: 'faq' as const, title: loc(f.question), text: loc(f.answer), href: '/faq' })),
    ...nav.flatMap((n) => n.children ?? []).filter((c) => c.href?.startsWith('/tools/')).map((c) => ({ type: 'tool' as const, title: loc(c.label), text: loc(c.description), href: c.href! })),
    ...services.map((s) => ({ type: 'service' as const, title: loc(s.title), text: loc(s.summary), href: `/services/${s.slug}` })),
    ...courses.map((c) => ({ type: 'course' as const, title: tm('course', { course: loc(c.name) }), text: loc(c.summary), href: `/test-prep/${c.slug}` })),
    ...(
      [
        ['about', 'crumbAbout', 'aboutDesc'],
        ['team', 'crumbTeam', 'teamDesc'],
        ['contact', 'crumbContact', 'contactDesc'],
        ['for-parents', 'crumbParents', 'parentsDesc'],
        ['success-stories', 'crumbStories', 'successStoriesDesc'],
        ['events', 'crumbEvents', 'eventsDesc'],
        ['webinars', 'crumbWebinars', 'webinarsDesc'],
      ] as const
    ).map(([path, title, desc]) => ({ type: 'page' as const, title: tm(title), text: tm(desc), href: `/${path}` })),
  ];

  return (
    <>
      <PageHero crumbs={[{ label: tm('search'), href: '/search' }]} title={tm('search')} />
      <div className="wrap page-body">
        <SiteSearch docs={docs} />
      </div>
    </>
  );
}

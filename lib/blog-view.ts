import 'server-only';
import { getFormatter, getTranslations } from 'next-intl/server';
import type { PostCardData } from '@/components/blog/post-card';
import { getCounsellors } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import type { BlogPostMeta } from '@/types/trust';

/** Locale-resolved card data for blog listings. */
export async function toCards(posts: BlogPostMeta[]): Promise<PostCardData[]> {
  const [t, format] = await Promise.all([getTranslations('trust.blog'), getFormatter()]);
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    cover: p.cover ?? null,
    topic: p.topic,
    topicLabel: t(`topics.${p.topic}`),
    date: p.date,
    dateLabel: format.dateTime(new Date(`${p.date}T00:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' }),
    readLabel: t('readTime', { n: p.readingMinutes }),
    countries: p.countries ?? [],
    needsReview: !!p.needs_review,
  }));
}

/** Author for a post: a counsellor profile, or the editorial team. */
export async function resolveAuthor(slug: string, locale: string) {
  const t = await getTranslations('trust.blog');
  const c = slug !== 'editorial' ? (await getCounsellors()).find((x) => x.slug === slug) : undefined;
  return c
    ? { name: c.name, href: `/team/${c.slug}`, bio: l(c.bio, locale) ?? '', photo: c.photo, jobTitle: l(c.role, locale) ?? '' }
    : { name: t('editorial'), href: '/editorial-policy', bio: t('editorialBio'), photo: null, jobTitle: '' };
}

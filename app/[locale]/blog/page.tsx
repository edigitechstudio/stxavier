import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BlogList } from '@/components/blog/blog-list';
import { PageHero } from '@/components/sx/page-hero';
import { listPosts } from '@/lib/blog';
import { toCards } from '@/lib/blog-view';
import { getDestinations } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';
import { BLOG_TOPICS } from '@/types/trust';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/blog', title: t('blog'), description: t('blogDesc') });
}

export default async function BlogPage() {
  const locale = await currentLocale();
  const [posts, destinations, t, tm] = await Promise.all([listPosts(locale), getDestinations(), getTranslations('trust.blog'), getTranslations('meta')]);
  const used = new Set(posts.map((p) => p.topic));

  return (
    <>
      <PageHero crumbs={[{ label: tm('crumbBlog'), href: '/blog' }]} title={tm('blog')} highlight={tm('blog').split(' ').slice(-1)[0]} subtitle={tm('blogDesc')} />
      <div className="wrap page-body">
        <BlogList
          posts={await toCards(posts)}
          topics={BLOG_TOPICS.filter((x) => used.has(x)).map((x) => ({ value: x, label: t(`topics.${x}`) }))}
          countries={destinations.map((d) => ({ value: d.slug, label: l(d.name, locale) ?? d.slug }))}
        />
      </div>
    </>
  );
}

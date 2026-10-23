import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BlogList } from '@/components/blog/blog-list';
import { PageHero } from '@/components/sx/page-hero';
import { listPosts } from '@/lib/blog';
import { toCards } from '@/lib/blog-view';
import { getDestinations } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';
import { BLOG_TOPICS, type BlogTopic } from '@/types/trust';

export function generateStaticParams() {
  return BLOG_TOPICS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/blog/topic/[topic]'>): Promise<Metadata> {
  const { topic } = await params;
  if (!BLOG_TOPICS.includes(topic as BlogTopic)) return {};
  const [locale, t, tm] = await Promise.all([currentLocale(), getTranslations('trust.blog'), getTranslations('meta')]);
  const label = t(`topics.${topic as BlogTopic}`);
  return pageMetadata({ locale, path: `/blog/topic/${topic}`, title: `${label} — ${tm('crumbBlog')}`, description: tm('blogDesc') });
}

export default async function TopicPage({ params }: PageProps<'/[locale]/blog/topic/[topic]'>) {
  const { topic } = await params;
  if (!BLOG_TOPICS.includes(topic as BlogTopic)) notFound();
  const locale = await currentLocale();
  const [posts, destinations, t, tm] = await Promise.all([listPosts(locale), getDestinations(), getTranslations('trust.blog'), getTranslations('meta')]);
  const label = t(`topics.${topic as BlogTopic}`);

  return (
    <>
      <PageHero crumbs={[{ label: tm('crumbBlog'), href: '/blog' }, { label, href: `/blog/topic/${topic}` }]} title={label} subtitle={tm('blogDesc')} />
      <div className="wrap page-body">
        <BlogList
          initialTopic={topic}
          posts={await toCards(posts.filter((p) => p.topic === topic))}
          topics={[]}
          countries={destinations.map((d) => ({ value: d.slug, label: l(d.name, locale) ?? d.slug }))}
        />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlertTriangle, CalendarDays, Clock } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { MdxContent } from '@/components/blog/mdx-content';
import { PostCard } from '@/components/blog/post-card';
import { CtaBanner } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/sx/page-hero';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';
import { getPost, listPosts } from '@/lib/blog';
import { resolveAuthor, toCards } from '@/lib/blog-view';
import { getHomeContent } from '@/lib/content';
import { env } from '@/lib/env';
import { currentLocale } from '@/lib/i18n/locale';
import { articleSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';

export async function generateStaticParams() {
  const posts = await listPosts('en');
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: 'none' }];
}

export async function generateMetadata({ params }: PageProps<'/[locale]/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const locale = await currentLocale();
  const post = await getPost(slug, locale);
  if (!post) return {};
  return {
    ...pageMetadata({ locale, path: `/blog/${slug}`, title: post.meta.title, description: post.meta.description, image: post.meta.cover, type: 'article' }),
  };
}

export default async function PostPage({ params }: PageProps<'/[locale]/blog/[slug]'>) {
  const { slug } = await params;
  const locale = await currentLocale();
  const [post, all, home, t, tm, format] = await Promise.all([
    getPost(slug, locale),
    listPosts(locale),
    getHomeContent(),
    getTranslations('trust.blog'),
    getTranslations('meta'),
    getFormatter(),
  ]);
  if (!post) notFound();
  const { meta, body } = post;
  const author = await resolveAuthor(meta.author, locale);
  const date = (iso: string) => format.dateTime(new Date(`${iso}T00:00:00Z`), { dateStyle: 'long', timeZone: 'UTC' });

  // Related: same topic first, then shared countries.
  const related = all
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: (p.topic === meta.topic ? 2 : 0) + (p.countries ?? []).filter((c) => meta.countries?.includes(c)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p);
  const url = absoluteUrl(locale, `/blog/${slug}`);

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbBlog'), href: '/blog' }, { label: t(`topics.${meta.topic}`), href: `/blog/topic/${meta.topic}` }, { label: meta.title, href: `/blog/${slug}` }]}
        eyebrow={t(`topics.${meta.topic}`)}
        title={meta.title}
        subtitle={meta.description}
        image={meta.cover}
      >
        <div className="flex flex-wrap gap-4 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} aria-hidden /> <time dateTime={meta.date}>{date(meta.date)}</time></span>
          {meta.updated && meta.updated !== meta.date && <span>{t('updated', { date: date(meta.updated) })}</span>}
          <span className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden /> {t('readTime', { n: meta.readingMinutes })}</span>
          <span>{t('by', { name: author.name })}</span>
        </div>
      </PageHero>

      <div className="wrap page-body">
        <div className="article-layout">
          <article>
            {meta.needs_review && !env.isProduction && <p className="draft-banner"><AlertTriangle size={18} aria-hidden /> {t('needsReview')}</p>}
            {locale !== meta.locale && <p className="tool-note mb-4">{t('englishShown')}</p>}
            <div className="prose" lang={meta.locale} data-speakable>
              <MdxContent source={body} format={post.meta.source === 'db' ? 'md' : 'mdx'} />
            </div>
            <div className="author-box">
              <span className="author-avatar">
                {author.photo ? <SmartImage src={author.photo} alt="" fill sizes="60px" className="object-cover" /> : 'SX'}
              </span>
              <div>
                <strong><Link href={author.href}>{author.name}</Link></strong>
                {author.jobTitle && <span className="team-role">{author.jobTitle}</span>}
                <p>{author.bio}</p>
              </div>
            </div>
          </article>
          {meta.headings.length > 1 && (
            <aside className="sticky-aside">
              <nav className="toc" aria-label={tm('crumbBlog')}>
                <ol>
                  {meta.headings.map((h) => (
                    <li key={h.id} style={{ paddingLeft: h.depth === 3 ? 14 : 0 }}><a href={`#${h.id}`}>{h.text}</a></li>
                  ))}
                </ol>
              </nav>
            </aside>
          )}
        </div>

        {related.length > 0 && (
          <section className="block" aria-labelledby="related-title">
            <h2 id="related-title">{t('related')}</h2>
            <div className="card-grid">{(await toCards(related)).map((p) => <PostCard key={p.slug} post={p} />)}</div>
          </section>
        )}
      </div>
      <CtaBanner home={home} locale={locale} />
      <JsonLd
        data={articleSchema({
          headline: meta.title,
          description: meta.description,
          url,
          image: meta.cover,
          datePublished: meta.date,
          dateModified: meta.updated ?? meta.date,
          author: { name: author.name, url: absoluteUrl(locale, author.href) },
        })}
      />
    </>
  );
}

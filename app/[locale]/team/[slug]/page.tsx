import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Flag } from '@/components/brand/flag';
import { CtaBanner } from '@/components/home/feature-sections';
import { JsonLd } from '@/components/seo/json-ld';
import { PageHero } from '@/components/sx/page-hero';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';
import { getCounsellor, getCounsellors, getDestinations, getHomeContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { personSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/urls';

export async function generateStaticParams() {
  const team = await getCounsellors();
  // At least one param is needed to prerender; unknown slugs render the 404 page.
  return team.length ? team.map((c) => ({ slug: c.slug })) : [{ slug: 'team' }];
}

export async function generateMetadata({ params }: PageProps<'/[locale]/team/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const [locale, c] = await Promise.all([currentLocale(), getCounsellor(slug)]);
  if (!c) return {};
  return pageMetadata({
    locale,
    path: `/team/${c.slug}`,
    title: c.name,
    description: (l(c.bio, locale) ?? '').slice(0, 155),
    image: c.photo ?? undefined,
    noindex: c.is_placeholder,
  });
}

export default async function CounsellorPage({ params }: PageProps<'/[locale]/team/[slug]'>) {
  const { slug } = await params;
  const locale = await currentLocale();
  const [c, destinations, home, t, tm] = await Promise.all([
    getCounsellor(slug),
    getDestinations(),
    getHomeContent(),
    getTranslations('pages'),
    getTranslations('meta'),
  ]);
  if (!c) notFound();

  const handles = destinations.filter((d) => c.destinations.includes(d.slug));
  const firstName = c.name.split(' ')[0];

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbTeam'), href: '/team' }, { label: c.name, href: `/team/${c.slug}` }]}
        title={c.name}
        subtitle={l(c.role, locale)}
      />
      <div className="wrap page-body">
        <div className="profile">
          <div className="profile-photo">
            <SmartImage src={c.photo ?? ''} alt={c.name} fill sizes="360px" />
          </div>
          <div>
            {c.is_placeholder && <p className="draft-banner">TODO: sample profile, hidden in production.</p>}
            <p className="answer">{l(c.bio, locale)}</p>
            <dl>
              {c.years_experience ? (
                <div>
                  <dt>{t('experience', { n: c.years_experience })}</dt>
                </div>
              ) : null}
              <div>
                <dt>{t('specializations')}</dt>
                <dd>{c.specializations.map((s) => l(s, locale)).join(' · ')}</dd>
              </div>
              <div>
                <dt>{t('languages')}</dt>
                <dd>{c.languages.join(', ')}</dd>
              </div>
              {handles.length > 0 && (
                <div>
                  <dt>{t('handles')}</dt>
                  <dd>
                    <ul className="pill-list mt-2">
                      {handles.map((d) => (
                        <li key={d.slug}>
                          <Link href={`/study-in/${d.slug}`} className="inline-flex items-center gap-2">
                            <Flag code={d.iso2} /> {l(d.name, locale)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-8">
              <Link href={{ pathname: '/book', query: { counsellor: c.slug } }} className="btn btn-primary btn-lg">
                {t('book', { name: firstName })} <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <CtaBanner home={home} locale={locale} />
      <JsonLd
        data={personSchema({
          name: c.name,
          jobTitle: l(c.role, 'en') ?? '',
          url: absoluteUrl(locale, `/team/${c.slug}`),
          image: c.photo ?? undefined,
          knowsLanguage: c.languages,
          description: l(c.bio, locale),
        })}
      />
    </>
  );
}

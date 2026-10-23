import { ChevronRight, Home } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { breadcrumbSchema } from '@/lib/schema';
import { absoluteUrl } from '@/lib/seo/urls';
import { JsonLd } from './json-ld';

export type Crumb = { label: string; href: string };

/** Visible breadcrumb trail + BreadcrumbList schema. Pass the trail after "Home". */
export async function Breadcrumbs({ items }: { items: Crumb[] }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('common')]);
  const trail = [{ label: t('home'), href: '/' }, ...items];

  return (
    <>
      <nav aria-label={t('breadcrumb')} className="crumbs">
        <ol>
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={c.href}>
                {i > 0 && <ChevronRight size={14} aria-hidden />}
                {last ? (
                  <span aria-current="page">{c.label}</span>
                ) : (
                  <Link href={c.href}>
                    {i === 0 && <Home size={14} aria-hidden />}
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(trail.map((c) => ({ name: c.label, url: absoluteUrl(locale, c.href) })))} />
    </>
  );
}

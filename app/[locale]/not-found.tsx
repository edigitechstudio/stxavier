import { ArrowLeft, Search } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const POPULAR = [
  { href: '/destinations', key: 'destinations' },
  { href: '/tools', key: 'tools' },
  { href: '/test-prep', key: 'testPrep' },
  { href: '/contact', key: 'contact' },
] as const;

export default async function NotFound() {
  const [t, locale] = await Promise.all([getTranslations('notFound'), getLocale()]);

  return (
    <section className="wrap notfound">
      <p className="notfound-code" aria-hidden>404</p>
      <h1>{t('title')}</h1>
      <p className="section-sub">{t('body')}</p>

      <form action={`/${locale}/search`} method="get" role="search" className="notfound-search">
        <label htmlFor="nf-search" className="sr-only">{t('search')}</label>
        <input id="nf-search" name="q" type="search" placeholder={t('searchPlaceholder')} />
        <button type="submit" className="btn btn-primary" aria-label={t('search')}>
          <Search size={18} />
        </button>
      </form>

      <h2 className="sr-only">{t('popular')}</h2>
      <div className="notfound-links">
        {POPULAR.map((p) => (
          <Link key={p.href} href={p.href}>{t(`links.${p.key}`)}</Link>
        ))}
      </div>
      <div className="center">
        <Link href="/" className="link-arrow">
          <ArrowLeft size={16} aria-hidden /> {t('back')}
        </Link>
      </div>
    </section>
  );
}

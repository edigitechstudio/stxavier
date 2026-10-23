import { Mail, Phone, Sparkles, UserRound } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Logo } from '@/components/brand/logo';
import { Link } from '@/i18n/navigation';
import { getNavigation, getSiteSettings } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { LocaleSwitcher } from './locale-switcher';
import { resolveNav } from './resolve-nav';
import { SiteNav } from './site-nav';
import { ThemeToggle } from './theme-toggle';

export async function Header() {
  const [locale, t, tTheme, nav, site] = await Promise.all([
    getLocale(),
    getTranslations('header'),
    getTranslations('theme'),
    getNavigation('header'),
    getSiteSettings(),
  ]);

  const items = resolveNav(nav, locale, {
    destinations: t('allDestinations'),
    services: t('allServices'),
    'test-prep': t('allTestPrep'),
    tools: t('allTools'),
  });
  const announcement = l(site.announcement, locale);

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <Link href="/book" className="topbar-left">
            <Sparkles size={14} aria-hidden />
            <span>{announcement ?? site.tagline.ne}</span>
          </Link>
          <nav aria-label={t('contactNav')}>
            <a href={`tel:${site.phone}`}><Phone size={13} aria-hidden /> {site.phone}</a>
            <a href={`mailto:${site.email}`}><Mail size={13} aria-hidden /> {site.email}</a>
            <Link href="/portal"><UserRound size={13} aria-hidden /> {t('studentPortal')}</Link>
          </nav>
        </div>
      </div>

      <SiteNav
        items={items}
        logo={<Logo name={site.name} />}
        labels={{
          primaryNav: t('primaryNav'),
          getStarted: t('getStarted'),
          openMenu: t('openMenu'),
          closeMenu: t('closeMenu'),
          book: t('bookCounselling'),
        }}
        actions={
          <>
            <LocaleSwitcher label={t('language')} switchTo={t('switchTo')} />
            <ThemeToggle labels={{ toggle: tTheme('toggle'), light: tTheme('light'), dark: tTheme('dark'), system: tTheme('system') }} />
          </>
        }
      />
    </>
  );
}

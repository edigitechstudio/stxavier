import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DynamicIcon } from '@/components/icons';
import { CtaBanner } from '@/components/home/feature-sections';
import { PageHero } from '@/components/sx/page-hero';
import { Reveal } from '@/components/sx/reveal';
import { Link } from '@/i18n/navigation';
import { getHomeContent, getNavigation, getPageContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/tools', title: t('tools'), description: t('toolsDesc') });
}

export default async function ToolsIndex() {
  const locale = await currentLocale();
  const [config, nav, home, t, tm] = await Promise.all([
    getPageContent('tools'),
    getNavigation('header'),
    getHomeContent(),
    getTranslations('tools'),
    getTranslations('meta'),
  ]);
  const tools = nav.find((n) => n.id === 'tools')?.children ?? [];
  const h = config.index;

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbTools'), href: '/tools' }]}
        eyebrow={l(h.eyebrow, locale)}
        title={l(h.title, locale) ?? ''}
        highlight={l(h.highlight, locale)}
        subtitle={l(h.subtitle, locale)}
        image={h.image}
      />
      <div className="wrap page-body">
        <div className="card-grid">
          {tools.map((tool, i) => (
            <Reveal key={tool.id} delay={(i % 3) * 80}>
              <Link href={tool.href ?? '/tools'} className="tool-card h-full">
                <span className="tool-icon"><DynamicIcon name={tool.icon} className="size-[22px]" /></span>
                <h2 className="text-lg font-extrabold">{l(tool.label, locale)}</h2>
                {tool.description && <p>{l(tool.description, locale)}</p>}
                <span className="link-arrow">{t('open')} <ArrowRight size={16} aria-hidden /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
      <CtaBanner home={home} locale={locale} />
    </>
  );
}

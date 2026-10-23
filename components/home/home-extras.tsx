import { ArrowRight } from 'lucide-react';
import { DynamicIcon } from '@/components/icons';
import { Reveal } from '@/components/sx/reveal';
import { SectionHead } from '@/components/sx/section-head';
import { CounsellorCard, type CounsellorCardLabels } from '@/components/team/counsellor-card';
import { Link } from '@/i18n/navigation';
import { l } from '@/lib/i18n/localize';
import type { Counsellor, HomeContent, Locale, NavItem } from '@/types/content';

/** Teaser for the free tools; items come from the "Tools" menu so both stay in sync. */
export function ToolsTeaser({ heading, tools, locale }: { heading: HomeContent['tools']; tools: NavItem[]; locale: Locale }) {
  if (!tools.length) return null;
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead eyebrow={l(heading.eyebrow, locale)} title={l(heading.title, locale) ?? ''} sub={l(heading.subtitle, locale)} />
        <div className="card-grid">
          {tools.slice(0, 6).map((tool, i) => (
            <Reveal key={tool.id} delay={(i % 3) * 80}>
              <Link href={tool.href ?? '/tools'} className="tool-card h-full">
                <span className="tool-icon"><DynamicIcon name={tool.icon} className="size-[22px]" /></span>
                <h3>{l(tool.label, locale)}</h3>
                {tool.description && <p>{l(tool.description, locale)}</p>}
                <span className="link-arrow">
                  <ArrowRight size={16} aria-hidden />
                  <span className="sr-only">{l(tool.label, locale)}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TeamStrip({
  heading,
  team,
  locale,
  labels,
}: {
  heading: HomeContent['team'];
  team: Counsellor[];
  locale: Locale;
  labels: CounsellorCardLabels;
}) {
  const featured = team.filter((c) => c.featured).slice(0, 4);
  if (!featured.length) return null;
  return (
    <section className="section why">
      <div className="wrap">
        <SectionHead eyebrow={l(heading.eyebrow, locale)} title={l(heading.title, locale) ?? ''} sub={l(heading.subtitle, locale)} />
        <div className="card-grid cols-4">
          {featured.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 4) * 80}>
              <CounsellorCard c={c} locale={locale} labels={labels} />
            </Reveal>
          ))}
        </div>
        <div className="center">
          <Link href="/team" className="btn btn-dark">
            {l(heading.cta, locale)} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

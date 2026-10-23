import { ArrowRight, GraduationCap } from 'lucide-react';
import { DynamicIcon } from '@/components/icons';
import { CounsellingButton } from '@/components/sx/counselling';
import { Highlight } from '@/components/sx/highlight';
import { Reveal } from '@/components/sx/reveal';
import { SectionHead } from '@/components/sx/section-head';
import { Link } from '@/i18n/navigation';
import { l } from '@/lib/i18n/localize';
import type { HomeContent, Locale, Service } from '@/types/content';

export function Intro({ home, locale }: { home: HomeContent; locale: Locale }) {
  return (
    <section className="intro">
      <div className="wrap">
        <Reveal className="intro-card">
          <div className="intro-badge">
            <GraduationCap size={34} aria-hidden />
          </div>
          <div>
            <h2>
              <Highlight text={l(home.intro.title, locale) ?? ''} highlight={l(home.intro.highlight, locale)} />
            </h2>
            <p data-speakable>{l(home.intro.body, locale)}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Services({
  home,
  services,
  locale,
  learnMore,
  hideHeading = false,
}: {
  home: HomeContent;
  services: Service[];
  locale: Locale;
  learnMore: string;
  hideHeading?: boolean;
}) {
  const c = home.comprehensive;
  return (
    <section className="section" id="services">
      <div className="wrap">
        {!hideHeading && (
          <SectionHead eyebrow={l(home.services.eyebrow, locale)} title={l(home.services.title, locale) ?? ''} sub={l(home.services.subtitle, locale)} />
        )}

        {services.length > 0 && (
          <div className="services-grid">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 4) * 90} className="service-card">
                <div className="service-icon">
                  <DynamicIcon name={s.icon} className="size-[26px]" />
                </div>
                <h3>{l(s.title, locale)}</h3>
                <p>{l(s.summary, locale)}</p>
                <Link href={`/services/${s.slug}`} className="link-arrow">
                  {learnMore} <ArrowRight size={16} aria-hidden />
                  <span className="sr-only">: {l(s.title, locale)}</span>
                </Link>
                <span className="service-num" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal className="comprehensive">
          <div className="comprehensive-glow" />
          <div className="comprehensive-icon">
            <DynamicIcon name="Globe2" className="size-[34px]" />
          </div>
          <div>
            <h3>{l(c.title, locale)}</h3>
            <p>{l(c.body, locale)}</p>
            <div className="chips">
              {c.chips.map((chip) => (
                <span key={chip.en} className="chip">{l(chip, locale)}</span>
              ))}
            </div>
          </div>
          <CounsellingButton className="btn btn-accent">
            {l(c.cta, locale)} <ArrowRight size={16} aria-hidden />
          </CounsellingButton>
        </Reveal>
      </div>
    </section>
  );
}

import { ArrowRight, ArrowUpRight, GraduationCap } from 'lucide-react';
import { DynamicIcon } from '@/components/icons';
import { CounsellingButton } from '@/components/sx/counselling';
import { Highlight } from '@/components/sx/highlight';
import { Reveal } from '@/components/sx/reveal';
import { SectionHead } from '@/components/sx/section-head';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';
import { l } from '@/lib/i18n/localize';
import type { Feature, HomeContent, Locale, Partner } from '@/types/content';

type Head = HomeContent['edge'];
const head = (h: Head, locale: Locale) => ({ eyebrow: l(h.eyebrow, locale), title: l(h.title, locale) ?? '', sub: l(h.subtitle, locale) });

export function Edge({ heading, items, locale }: { heading: Head; items: Feature[]; locale: Locale }) {
  if (!items.length) return null;
  return (
    <section className="section edge">
      <div className="wrap">
        <SectionHead {...head(heading, locale)} />
        <div className="edge-grid">
          {items.map((e, i) => (
            <Reveal key={e.id} delay={(i % 4) * 80} className="edge-item">
              <div className="edge-ring">
                <DynamicIcon name={e.icon} className="size-[30px] stroke-[1.6]" />
              </div>
              <h3>{l(e.title, locale)}</h3>
              <p>{l(e.text, locale)}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyChoose({ heading, items, locale }: { heading: Head; items: Feature[]; locale: Locale }) {
  if (!items.length) return null;
  return (
    <section className="section why">
      <div className="wrap">
        <SectionHead {...head(heading, locale)} />
        <div className="why-grid">
          {items.map((w, i) => (
            <Reveal key={w.id} delay={(i % 2) * 90} className={`why-card ${items.length % 2 === 1 && i === items.length - 1 ? 'is-wide' : ''}`}>
              <div className="why-icon">
                <DynamicIcon name={w.icon} className="size-[22px]" />
              </div>
              <div>
                <h3>{l(w.title, locale)}</h3>
                <p>{l(w.text, locale)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Process({ heading, items, locale }: { heading: HomeContent['process']; items: Feature[]; locale: Locale }) {
  if (!items.length) return null;
  return (
    <section className="section process">
      <div className="wrap">
        <SectionHead {...head(heading, locale)} />
        <ol className="process-grid">
          {items.map((p, i) => (
            <Reveal as="li" key={p.id} delay={i * 90} className="process-card">
              {p.label && <span className={`step-badge tone-${i % 4}`}>{l(p.label, locale)}</span>}
              <div className={`process-icon tone-${i % 4}`}>
                <DynamicIcon name={p.icon} className="size-[22px]" />
              </div>
              <div>
                <h3>{l(p.title, locale)}</h3>
                <p>{l(p.text, locale)}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <div className="center">
          <CounsellingButton className="btn btn-primary btn-lg">
            {l(heading.cta, locale)} <ArrowRight size={18} aria-hidden />
          </CounsellingButton>
        </div>
      </div>
    </section>
  );
}

export function CtaBanner({ home, locale }: { home: HomeContent; locale: Locale }) {
  const c = home.cta_banner;
  return (
    <section className="cta">
      <div className="cta-bg">
        <SmartImage src={c.image} alt="" fill sizes="100vw" />
      </div>
      <div className="cta-overlay" />
      <div className="wrap cta-inner">
        <Reveal>
          <h2>
            <Highlight text={l(c.title, locale) ?? ''} highlight={l(c.highlight, locale)} />
          </h2>
          <p>{l(c.body, locale)}</p>
        </Reveal>
        <Reveal delay={120}>
          <CounsellingButton className="btn btn-white btn-lg">
            {l(c.cta, locale)} <ArrowRight size={18} aria-hidden />
          </CounsellingButton>
        </Reveal>
      </div>
    </section>
  );
}

export function Essentials({ heading, items, locale, detailsLabel }: { heading: Head; items: Feature[]; locale: Locale; detailsLabel: (title: string) => string }) {
  if (!items.length) return null;
  return (
    <section className="section essentials">
      <div className="wrap">
        <SectionHead {...head(heading, locale)} />
        <div className="ess-grid">
          {items.map((e, i) => {
            const title = l(e.title, locale) ?? '';
            return (
              <Reveal key={e.id} delay={i * 90} className={`ess-card tint-${i % 3}`}>
                <div className="ess-art">
                  <span className="ess-orb" />
                  <DynamicIcon name={e.icon} className="size-14 stroke-[1.4]" />
                </div>
                <h3>{title}</h3>
                <p>{l(e.text, locale)}</p>
                {e.href && (
                  <Link href={e.href} className="ess-link" aria-label={detailsLabel(title)}>
                    <ArrowUpRight size={18} />
                  </Link>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Partners({ heading, partners, locale }: { heading: HomeContent['partners']; partners: Partner[]; locale: Locale }) {
  if (!partners.length) return null;
  const row = [...partners, ...partners]; // duplicated for a seamless loop
  return (
    <section className="section partners">
      <div className="wrap">
        <SectionHead {...head(heading, locale)} />
      </div>
      <div className="marquee">
        <ul className="marquee-track">
          {row.map((p, i) => (
            <li key={`${p.id}-${i}`} className="partner" aria-hidden={i >= partners.length || undefined}>
              <GraduationCap size={22} aria-hidden />
              <span>{p.name}</span>
              {p.is_placeholder && i < partners.length && <span className="todo-badge">TODO</span>}
            </li>
          ))}
        </ul>
      </div>
      <div className="center">
        <Link href="/universities" className="btn btn-dark">
          {l(heading.cta, locale)} <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

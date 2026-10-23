import { useState } from 'react';
import { ArrowRight, Plus, ArrowUpRight, GraduationCap } from 'lucide-react';
import { process, essentials, partners, faqs, img } from '../data';
import { Icon, Reveal, SafeImg, SectionHead, useCounselling } from './ui';

export function Process() {
  const { open } = useCounselling();
  return (
    <section className="section process">
      <div className="container">
        <SectionHead
          eyebrow="How We Help You"
          title="How Our Study Abroad Consultancy Works"
          sub="Our consultancy makes the study abroad process simple and structured. Here's how we support you step by step."
        />
        <div className="process-grid">
          {process.map((p, i) => (
            <Reveal key={p.title} delay={i * 90} className="process-card">
              <span className={`step-badge tone-${i}`}>{p.step}</span>
              <div className={`process-icon tone-${i}`}>
                <Icon name={p.icon} size={22} />
              </div>
              <div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="center">
          <button className="btn btn-primary btn-lg" onClick={open}>
            Get Started Today <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

export function CtaBanner() {
  const { open } = useCounselling();
  return (
    <section className="cta">
      <SafeImg src={img('1541339907198-e08756dedf3f', 1800)} alt="" className="cta-bg" />
      <div className="cta-overlay" />
      <div className="container cta-inner">
        <Reveal>
          <h2>
            There’s a University waiting to <em>fulfil your study goals</em>
          </h2>
          <p>
            Get expert advice on choosing education institutes, addressing the admissions process, scholarships, visa
            and more. Get consulted now.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <button className="btn btn-white btn-lg" onClick={open}>
            Get Consultant Now <ArrowRight size={18} />
          </button>
        </Reveal>
      </div>
    </section>
  );
}

export function Essentials() {
  return (
    <section className="section essentials">
      <div className="container">
        <SectionHead eyebrow="Essential Services" title="Get The Lowest Rate" />
        <div className="ess-grid">
          {essentials.map((e, i) => (
            <Reveal key={e.title} delay={i * 90} className={`ess-card tint-${e.tint}`}>
              <div className="ess-art">
                <span className="ess-orb" />
                <Icon name={e.icon} size={56} strokeWidth={1.4} />
              </div>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
              <a href="#" className="ess-link" aria-label={`${e.title} details`}>
                <ArrowUpRight size={18} />
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Partners() {
  const row = [...partners, ...partners];
  return (
    <section className="section partners">
      <div className="container">
        <SectionHead title="Our University Partners" sub="Trusted by leading institutions worldwide" />
      </div>
      <div className="marquee" aria-label="Partner universities">
        <div className="marquee-track">
          {row.map((p, i) => (
            <div key={i} className="partner" aria-hidden={i >= partners.length}>
              <GraduationCap size={22} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="center">
        <a href="#" className="btn btn-dark">
          View All Partners <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

export function Faq() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section className="section faq">
      <div className="container faq-layout">
        <div>
          <SectionHead
            align="left"
            eyebrow="Frequently Asked Questions"
            title="Have Questions? We Have Answers"
            sub="Find answers to common questions about studying abroad and our consultancy services."
          />
          <Reveal className="faq-aside">
            <SafeImg src={img('1522202176988-66273c2fd55f', 800)} alt="Students studying together" />
            <div className="faq-aside-card">
              <strong>Still have questions?</strong>
              <span>Our counsellors reply within one working day.</span>
            </div>
          </Reveal>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <Reveal key={f.q} delay={i * 50} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                >
                  {f.q}
                  <span className="faq-toggle"><Plus size={18} /></span>
                </button>
                <div className="faq-a">
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

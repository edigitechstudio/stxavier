import { ArrowRight, GraduationCap } from 'lucide-react';
import { services, comprehensiveChips } from '../data';
import { Icon, Reveal, SectionHead, useCounselling } from './ui';

export function Intro() {
  return (
    <section className="intro">
      <div className="container">
        <Reveal className="intro-card">
          <div className="intro-badge">
            <GraduationCap size={34} />
          </div>
          <div>
            <h2>
              Your Trusted <em>Study Abroad</em> Partner
            </h2>
            <p>
              <strong>St. Xavier Educational Network</strong> helps students plan, apply, and succeed in their study
              abroad journey. Our consultants guide you through <a href="#services">university selection</a>,{' '}
              <a href="#services">admissions</a>, <a href="#services">test preparation</a>,{' '}
              <a href="#services">scholarships</a>, <a href="#services">visa processing</a>, and{' '}
              <a href="#services">post-arrival support</a>.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Services() {
  const { open } = useCounselling();
  return (
    <section className="section" id="services">
      <div className="container">
        <SectionHead eyebrow="Student Services" title="Wide Range of Services" />

        <div className="services-grid">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 90} className="service-card">
              <div className="service-icon">
                <Icon name={s.icon} size={26} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <a href="#" className="link-arrow">
                Learn More <ArrowRight size={16} />
              </a>
              <span className="service-num">0{i + 1}</span>
            </Reveal>
          ))}
        </div>

        <Reveal className="comprehensive">
          <div className="comprehensive-glow" />
          <div className="comprehensive-icon">
            <Icon name="Globe2" size={34} />
          </div>
          <div className="comprehensive-body">
            <h3>Comprehensive Study Abroad Services</h3>
            <p>
              From choosing the right country to securing your student visa, we offer end-to-end study abroad support.
              Our counsellors help with university search, test prep, documentation and interview preparation so
              students feel confident at every step.
            </p>
            <div className="chips">
              {comprehensiveChips.map((c) => (
                <span key={c} className="chip">{c}</span>
              ))}
            </div>
          </div>
          <button className="btn btn-accent" onClick={open}>
            Talk to an Expert <ArrowRight size={16} />
          </button>
        </Reveal>
      </div>
    </section>
  );
}

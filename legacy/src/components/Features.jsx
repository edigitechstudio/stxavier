import { edge, whyChoose } from '../data';
import { Icon, Reveal, SectionHead } from './ui';

export function Edge() {
  return (
    <section className="section edge">
      <div className="container">
        <SectionHead eyebrow="The St. Xavier Edge" title="Built on two decades of trust" />
        <div className="edge-grid">
          {edge.map((e, i) => (
            <Reveal key={e.title} delay={(i % 4) * 80} className="edge-item">
              <div className="edge-ring">
                <Icon name={e.icon} size={30} strokeWidth={1.6} />
              </div>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyChoose() {
  return (
    <section className="section why">
      <div className="container">
        <SectionHead
          eyebrow="Why Choose Us"
          title="Why Choose St. Xavier as Your Study Abroad Consultancy?"
          sub="With decades of experience and a proven track record, we provide comprehensive support at every step of your study abroad journey."
        />
        <div className="why-grid">
          {whyChoose.map((w, i) => (
            <Reveal key={w.title} delay={(i % 2) * 90} className={`why-card ${i === whyChoose.length - 1 ? 'is-wide' : ''}`}>
              <div className="why-icon">
                <Icon name={w.icon} size={22} />
              </div>
              <div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

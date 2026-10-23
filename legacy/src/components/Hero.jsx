import { useState } from 'react';
import { MapPin, BookOpen, Calendar, Search, ArrowRight, Play, ShieldCheck } from 'lucide-react';
import { heroStats, img, searchOptions } from '../data';
import { SafeImg, useCounselling } from './ui';

function Field({ icon: I, label, options, value, onChange }) {
  return (
    <label className="search-field">
      <I size={18} className="search-icon" />
      <span className="search-text">
        <small>{label}</small>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Any</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </span>
    </label>
  );
}

export default function Hero() {
  const { open } = useCounselling();
  const [q, setQ] = useState({ destination: '', field: '', intake: '' });
  const set = (k) => (v) => setQ((s) => ({ ...s, [k]: v }));

  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <SafeImg src={img('1523240795612-9a054b0db644', 2000)} alt="" loading="eager" />
      </div>
      <div className="hero-overlay" />

      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="hero-tag">
            <span className="pulse-dot" /> Transforming Lives
          </span>
          <h1>
            Trusted Study Abroad Consultancy for <em>Admissions, Test Prep</em> &amp; Global University Guidance
          </h1>
          <p>
            From choosing the right course to landing at your dream campus — St. Xavier Educational Network walks
            with you every step of the way.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={open}>
              Start Now <ArrowRight size={18} />
            </button>
            <button className="btn btn-glass btn-lg" onClick={open}>
              <span className="play-chip"><Play size={12} fill="currentColor" /></span>
              Book Free Counselling
            </button>
          </div>
        </div>

        <div className="hero-card" aria-label="Our impact">
          <div className="hero-card-head">
            <ShieldCheck size={18} /> Trusted by families nationwide
          </div>
          <div className="hero-stats">
            {heroStats.map((s) => (
              <div key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            open();
          }}
        >
          <Field icon={MapPin} label="Destination" options={searchOptions.destinations} value={q.destination} onChange={set('destination')} />
          <Field icon={BookOpen} label="Field of study" options={searchOptions.fields} value={q.field} onChange={set('field')} />
          <Field icon={Calendar} label="Preferred intake" options={searchOptions.intakes} value={q.intake} onChange={set('intake')} />
          <button type="submit" className="btn btn-accent search-btn">
            <Search size={18} /> Search
          </button>
        </form>
      </div>
    </section>
  );
}

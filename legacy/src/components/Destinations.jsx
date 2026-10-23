import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { destinations } from '../data';
import { Reveal, SafeImg, SectionHead } from './ui';

// Map viewBox is cropped to latitudes 80°N → 60°S (see public/world-map.svg).
const pos = ({ lat, lon }) => ({
  left: `${((lon + 180) / 360) * 100}%`,
  top: `${((80 - lat) / 140) * 100}%`,
});

export default function Destinations() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [svg, setSvg] = useState('');
  const mapRef = useRef(null);
  const d = destinations[active];

  useEffect(() => {
    let alive = true;
    fetch('/world-map.svg')
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => alive && setSvg(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Paint destination countries and the active one.
  useEffect(() => {
    const root = mapRef.current;
    if (!root || !svg) return;
    root.querySelectorAll('.is-dest, .is-active').forEach((el) => el.classList.remove('is-dest', 'is-active'));
    destinations.forEach((x, i) =>
      root.querySelectorAll(`g.${x.code}`).forEach((g) => g.classList.add(i === active ? 'is-active' : 'is-dest'))
    );
  }, [svg, active]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % destinations.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const onMapClick = (e) => {
    const g = e.target.closest('g.country');
    if (!g) return;
    const i = destinations.findIndex((x) => g.classList.contains(x.code));
    if (i >= 0) setActive(i);
  };

  return (
    <section
      className="destinations"
      id="destinations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container">
        <SectionHead
          light
          eyebrow="Explore Destinations"
          title="Where will your degree take you?"
          sub="Tap a country on the map to discover what studying there looks like."
        />

        <div className="dest-layout">
          <Reveal className="dest-card" key={d.code}>
            <div className="dest-img">
              <SafeImg src={d.image} alt={`Study in ${d.name}`} />
              <span className="dest-badge">
                <Building2 size={14} /> {d.unis} universities
              </span>
            </div>
            <div className="dest-body">
              <h3>Study in {d.name}</h3>
              <p>{d.text}</p>
              <a href="#" className="link-arrow">
                Learn More <ArrowRight size={16} />
              </a>
            </div>
          </Reveal>

          <Reveal className="map-panel" delay={120}>
            <div className="world-map" ref={mapRef} onClick={onMapClick} dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="map-pins">
              {destinations.map((x, i) => (
                <button
                  key={x.code}
                  className={`pin ${i === active ? 'is-active' : ''}`}
                  style={pos(x)}
                  onClick={() => setActive(i)}
                  aria-label={`Study in ${x.name}`}
                >
                  <span className="pin-dot" />
                  <span className="pin-label">{x.name}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="dest-tabs" role="tablist" aria-label="Destinations">
          {destinations.map((x, i) => (
            <button
              key={x.code}
              role="tab"
              aria-selected={i === active}
              className={`dest-tab ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              {x.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

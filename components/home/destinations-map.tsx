'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import { Flag } from '@/components/brand/flag';
import { Reveal } from '@/components/sx/reveal';
import { SmartImage } from '@/components/sx/smart-image';
import { Link } from '@/i18n/navigation';

export type MapDestination = {
  slug: string;
  iso2: string;
  iso3: string;
  name: string;
  summary: string;
  image: string | null;
  badge: string | null;
  lat: number;
  lng: number;
};

type Labels = { studyIn: string; learnMore: string; list: string };

// The map SVG is cropped to latitudes 80°N → 60°S (public/world-map.svg).
const pos = ({ lat, lng }: MapDestination) => ({
  left: `${((lng + 180) / 360) * 100}%`,
  top: `${((80 - lat) / 140) * 100}%`,
});

/** Interactive SVG world map: published destinations highlighted, pins + tabs switch the card. */
export function DestinationsMap({ destinations, labels }: { destinations: MapDestination[]; labels: Labels }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [svg, setSvg] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const d = destinations[active];
  const studyIn = (name: string) => labels.studyIn.replace('{country}', name);

  // The 80 KB map is fetched only when the section approaches the viewport, so it never competes
  // with the hero for bandwidth on first load.
  useEffect(() => {
    let alive = true;
    const el = mapRef.current;
    const load = () =>
      fetch('/world-map.svg')
        .then((r) => (r.ok ? r.text() : ''))
        .then((t) => alive && setSvg(t))
        .catch(() => {});
    if (!el || !('IntersectionObserver' in window)) {
      void load();
      return () => {
        alive = false;
      };
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void load();
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, []);

  // Paint destination countries and the active one (ISO3 codes are the SVG class names).
  useEffect(() => {
    const root = mapRef.current;
    if (!root || !svg) return;
    root.querySelectorAll('.is-dest, .is-active').forEach((el) => el.classList.remove('is-dest', 'is-active'));
    destinations.forEach((x, i) =>
      root.querySelectorAll(`g.${x.iso3}`).forEach((g) => g.classList.add(i === active ? 'is-active' : 'is-dest')),
    );
  }, [svg, active, destinations]);

  useEffect(() => {
    if (paused || destinations.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % destinations.length), 5000);
    return () => window.clearInterval(t);
  }, [paused, destinations.length]);

  if (!d) return null;

  const onMapClick = (e: React.MouseEvent) => {
    const g = (e.target as Element).closest('g.country');
    if (!g) return;
    const i = destinations.findIndex((x) => g.classList.contains(x.iso3));
    if (i >= 0) setActive(i);
  };

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)}>
      <div className="dest-layout">
        <div className="dest-card" aria-live="polite" key={d.slug}>
          <div className="dest-img">
            <SmartImage src={d.image ?? ''} alt={studyIn(d.name)} fill sizes="360px" />
            <span className="dest-flag"><Flag code={d.iso2} className="h-5 w-7" /></span>
            {d.badge && (
              <span className="dest-badge">
                <Building2 size={14} aria-hidden /> {d.badge}
              </span>
            )}
          </div>
          <div className="dest-body">
            <h3>{studyIn(d.name)}</h3>
            <p>{d.summary}</p>
            <Link href={`/study-in/${d.slug}`} className="link-arrow">
              {labels.learnMore}<span className="sr-only">: {studyIn(d.name)}</span> <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>

        <Reveal className="map-panel" delay={120}>
          {/* Decorative map; the tabs below are the accessible control. */}
          <div className="world-map" ref={mapRef} onClick={onMapClick} aria-hidden dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="map-pins">
            {destinations.map((x, i) => (
              <button
                key={x.slug}
                type="button"
                tabIndex={-1}
                className={`pin ${i === active ? 'is-active' : ''}`}
                style={pos(x)}
                onClick={() => setActive(i)}
                aria-hidden
              >
                <span className="pin-dot" />
                <span className="pin-label">{x.name}</span>
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="dest-tabs" role="tablist" aria-label={labels.list}>
        {destinations.map((x, i) => (
          <button
            key={x.slug}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`dest-tab ${i === active ? 'is-active' : ''}`}
            onClick={() => setActive(i)}
          >
            <Flag code={x.iso2} /> {x.name}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

/** Click-to-load facade: keeps Google Maps' heavy scripts off the initial page load. */
export function MapEmbed({ src, title, loadLabel }: { src: string; title: string; loadLabel: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="map-facade">
      {loaded ? (
        <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setLoaded(true)}>
          <MapPin size={22} aria-hidden />
          {loadLabel}
        </button>
      )}
    </div>
  );
}

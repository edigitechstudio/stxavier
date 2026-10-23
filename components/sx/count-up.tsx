'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 when it scrolls into view. The server HTML contains the final
 * value (correct for crawlers and no-JS); the animation only runs for motion-tolerant users.
 */
export function CountUp({ value, locale, duration = 1600 }: { value: number; locale: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={ref}>{new Intl.NumberFormat(locale === 'ne' ? 'ne-NP' : 'en-US').format(display)}</span>;
}

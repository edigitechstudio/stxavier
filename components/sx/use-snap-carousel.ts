'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Scroll-snap carousel state: index of the first visible slide plus a goTo helper. */
export function useSnapCarousel(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const step = useCallback(() => {
    const el = track.current;
    const card = el?.firstElementChild;
    if (!el || !card) return 0;
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0');
  }, []);

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      el.scrollTo({ left: Math.min(Math.max(i, 0) * step(), max), behavior: 'smooth' });
    },
    [step],
  );

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const s = step();
      if (s) setIndex(Math.round(el.scrollLeft / s));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [step]);

  return { track, index, go, count };
}

export type Carousel = ReturnType<typeof useSnapCarousel>;

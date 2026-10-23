'use client';
import { useEffect, useRef } from 'react';

/** Decorative hero layer: a faint grid, two drifting glow orbs and a gentle pointer parallax (GSAP, loaded after paint). */
export function HeroFx() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let killed = false;
    let cleanup = () => {};

    import('gsap').then(({ gsap }) => {
      if (killed) return;
      const hero = el.closest('.hero') as HTMLElement | null;
      const orbs = el.querySelectorAll('.hero-orb');
      const drift = gsap.to(orbs, {
        x: (i: number) => (i ? -60 : 80),
        y: (i: number) => (i ? 40 : -50),
        scale: (i: number) => (i ? 1.15 : 0.9),
        duration: (i: number) => (i ? 9 : 11),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // Parallax only with a real mouse.
      let onMove: ((e: PointerEvent) => void) | null = null;
      if (hero && window.matchMedia('(pointer: fine)').matches) {
        const card = hero.querySelector('.journey');
        const grid = el.querySelector('.hero-grid');
        const cardX = card ? gsap.quickTo(card, 'x', { duration: 0.8, ease: 'power3' }) : null;
        const cardY = card ? gsap.quickTo(card, 'y', { duration: 0.8, ease: 'power3' }) : null;
        const gridX = grid ? gsap.quickTo(grid, 'x', { duration: 1.2, ease: 'power3' }) : null;
        const gridY = grid ? gsap.quickTo(grid, 'y', { duration: 1.2, ease: 'power3' }) : null;
        onMove = (e) => {
          const r = hero.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          cardX?.(nx * -14);
          cardY?.(ny * -10);
          gridX?.(nx * 18);
          gridY?.(ny * 12);
        };
        hero.addEventListener('pointermove', onMove);
      }

      cleanup = () => {
        drift.kill();
        if (hero && onMove) hero.removeEventListener('pointermove', onMove);
      };
    });

    return () => {
      killed = true;
      cleanup();
    };
  }, []);

  return (
    <div className="hero-fx" ref={ref} aria-hidden>
      <div className="hero-grid" />
      <span className="hero-orb is-red" />
      <span className="hero-orb is-blue" />
    </div>
  );
}

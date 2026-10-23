'use client';
import { useEffect, useRef } from 'react';
import {
  BookOpenCheck,
  BriefcaseBusiness,
  FileCheck2,
  GraduationCap,
  House,
  MessagesSquare,
  PlaneTakeoff,
  School,
  Sparkles,
  Stamp,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

/** Icon keys staff can use in Website content → Page text & images → Home → Hero → Journey. */
const ICONS: Record<string, LucideIcon> = {
  counselling: MessagesSquare,
  'test-prep': BookOpenCheck,
  application: FileCheck2,
  visa: Stamp,
  departure: PlaneTakeoff,
  success: GraduationCap,
  trophy: Trophy,
  career: BriefcaseBusiness,
  school: School,
  home: House,
};

export type JourneyStepView = { icon: string; title: string; note: string | null };

/**
 * Vertical hero timeline: first visit → departure → success. Server HTML shows the finished route
 * (no-JS and reduced motion); GSAP, loaded after paint, replays it: each connector fills, a plane
 * hops down to the next milestone and the current one pulses.
 */
export function HeroJourney({ steps, label }: { steps: JourneyStepView[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLSpanElement>(null);
  const n = steps.length;

  useEffect(() => {
    const el = root.current;
    const jet = plane.current;
    if (!el || !jet || n < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let killed = false;
    let cleanup = () => {};

    import('gsap').then(({ gsap }) => {
      if (killed) return;
      const track = el.querySelector<HTMLElement>('.journey-track')!;
      const items = [...el.querySelectorAll<HTMLLIElement>('.journey-step')];
      const nodes = items.map((li) => li.querySelector<HTMLElement>('.journey-node')!);
      const fills = items.map((li) => li.querySelector<HTMLElement>('.journey-seg i'));
      const sparks = [...el.querySelectorAll<HTMLElement>('.journey-burst i')];

      // Plane position between the centres of node i-1 and node i, measured live (rows can wrap).
      const centre = (i: number) => {
        const r = nodes[i].getBoundingClientRect();
        return r.top + r.height / 2 - track.getBoundingClientRect().top;
      };
      const leg = { i: 1, t: 0 };
      const render = () => {
        const a = centre(leg.i - 1);
        const b = centre(leg.i);
        jet.style.top = `${a + (b - a) * leg.t}px`;
        const f = fills[leg.i - 1];
        if (f) f.style.transform = `scaleY(${leg.t})`;
      };

      const activate = (i: number) => {
        items.forEach((li, j) => {
          li.classList.toggle('is-done', j < i);
          li.classList.toggle('is-active', j === i);
        });
        gsap.fromTo(nodes[i], { scale: 0.75 }, { scale: 1, duration: 0.55, ease: 'back.out(3)' });
        gsap.fromTo(
          items[i].querySelector('.journey-text'),
          { x: -6, opacity: 0.4 },
          { x: 0, opacity: 1, duration: 0.45, ease: 'power2.out' },
        );
      };

      const reset = () => {
        items.forEach((li) => li.classList.remove('is-done', 'is-active'));
        fills.forEach((f) => f && gsap.set(f, { scaleY: 0, opacity: 1 }));
        gsap.set(jet, { opacity: 0, scale: 0.4, rotation: 90 });
      };

      // Finale: from the last milestone the plane flies up to the header logo and lands on the
      // logo's own rider (left of the globe), which glows. A fixed layer so it can cross the page.
      const flyer = document.createElement('span');
      flyer.className = 'journey-flyer';
      flyer.setAttribute('aria-hidden', 'true');
      flyer.innerHTML = jet.innerHTML;
      document.body.appendChild(flyer);
      gsap.set(flyer, { xPercent: -50, yPercent: -50, opacity: 0 });
      let flight: ReturnType<typeof gsap.timeline> | null = null;

      const flyToLogo = () => {
        const mark = document.querySelector<HTMLElement>('.header .logo-mark');
        const logo = mark?.closest<HTMLElement>('.logo');
        if (!mark || !logo) return;
        const from = nodes[n - 1].getBoundingClientRect();
        const to = mark.getBoundingClientRect();
        if (to.bottom < 0 || from.top > innerHeight) return;
        const a = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
        // The rider on the pen sits at about 16% across, 66% down the mark.
        const b = { x: to.left + to.width * 0.16, y: to.top + to.height * 0.66 };
        // Swing out wide before curving in to the logo.
        const c = {
          x: (a.x + b.x) / 2 + Math.min(260, Math.abs(a.x - b.x) * 0.3),
          y: Math.min(a.y, b.y) + 40,
        };
        const at = (t: number) => ({
          x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
          y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
        });
        const p = { t: 0 };
        let frame = 0;
        flight?.kill();
        flight = gsap
          .timeline()
          .set(flyer, { x: a.x, y: a.y, scale: 0.4, rotation: -90 })
          .to(flyer, { opacity: 1, scale: 1.25, duration: 0.25, ease: 'power2.out' })
          .to(
            p,
            {
              t: 1,
              duration: 1.7,
              ease: 'power2.inOut',
              onUpdate: () => {
                const q = at(p.t);
                const r = at(Math.min(1, p.t + 0.01));
                gsap.set(flyer, {
                  x: q.x,
                  y: q.y,
                  rotation: (Math.atan2(r.y - q.y, r.x - q.x) * 180) / Math.PI,
                  scale: 1.25 - p.t * 0.6,
                });
                // Glowing trail.
                if (frame++ % 3 === 0) {
                  const dot = document.createElement('span');
                  dot.className = 'journey-trail';
                  document.body.appendChild(dot);
                  gsap.set(dot, { x: q.x, y: q.y, xPercent: -50, yPercent: -50 });
                  gsap.to(dot, {
                    opacity: 0,
                    scale: 0.2,
                    duration: 0.7,
                    ease: 'power1.out',
                    onComplete: () => dot.remove(),
                  });
                }
              },
            },
            '<',
          )
          .to(flyer, { opacity: 0, scale: 0.3, duration: 0.2, ease: 'power2.in' }, '-=0.15')
          .call(() => {
            logo.classList.remove('is-docked');
            void logo.offsetWidth; // restart the CSS ring animation
            logo.classList.add('is-docked');
          })
          .fromTo(
            mark,
            { scale: 1 },
            {
              scale: 1.14,
              duration: 0.18,
              yoyo: true,
              repeat: 1,
              ease: 'power2.out',
              clearProps: 'transform',
            },
            '<',
          )
          .call(() => logo.classList.remove('is-docked'), [], '+=1.4');
      };

      el.classList.add('is-live');
      reset();

      const tl = gsap.timeline({ repeat: -1, paused: true });
      tl.call(reset)
        .call(() => activate(0))
        .to({}, { duration: 0.8 });
      for (let i = 1; i < n; i++) {
        // Take off, fly, touch down: the plane never sits on top of an icon.
        tl.call(() => {
          leg.i = i;
          leg.t = 0;
          render();
        })
          .to(jet, { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' })
          .to(leg, { t: 1, duration: 0.8, ease: 'power1.inOut', onUpdate: render }, '<')
          .to(jet, { opacity: 0, scale: 0.4, duration: 0.18, ease: 'power2.in' }, '-=0.18')
          .call(() => activate(i))
          .to({}, { duration: 0.55 });
      }
      tl.call(() => {
        items[n - 1].classList.add('is-done');
        gsap.fromTo(
          sparks,
          { x: 0, y: 0, opacity: 1, scale: 1 },
          {
            x: (k: number) => Math.cos((k / sparks.length) * Math.PI * 2) * 36,
            y: (k: number) => Math.sin((k / sparks.length) * Math.PI * 2) * 36,
            opacity: 0,
            scale: 0.3,
            duration: 1,
            ease: 'power3.out',
          },
        );
      })
        .to({}, { duration: 0.6 })
        .call(flyToLogo)
        .to({}, { duration: 3.2 })
        .to(fills.filter(Boolean), { opacity: 0, duration: 0.5 });

      // Only animate while the hero is on screen.
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), {
        threshold: 0.2,
      });
      io.observe(el);
      cleanup = () => {
        io.disconnect();
        tl.kill();
        flight?.kill();
        flyer.remove();
        document.querySelectorAll('.journey-trail').forEach((d) => d.remove());
        document.querySelector('.header .logo')?.classList.remove('is-docked');
        el.classList.remove('is-live');
      };
    });

    return () => {
      killed = true;
      cleanup();
    };
  }, [n, steps]);

  if (n < 2) return null;

  return (
    <div className="journey" ref={root}>
      <p className="journey-head" aria-hidden>
        {label}
      </p>
      <div className="journey-track">
        <ol className="journey-steps" aria-label={label}>
          {steps.map((s, i) => {
            const Icon = ICONS[s.icon] ?? Sparkles;
            return (
              <li key={i} className="journey-step is-done">
                {i < n - 1 && (
                  <span className="journey-seg" aria-hidden>
                    <i />
                  </span>
                )}
                <span className="journey-node" aria-hidden>
                  <Icon size={18} strokeWidth={2} />
                  {i === n - 1 && (
                    <span className="journey-burst">
                      {Array.from({ length: 10 }, (_, k) => (
                        <i key={k} />
                      ))}
                    </span>
                  )}
                </span>
                <span className="journey-text">
                  <strong>
                    <span className="journey-num" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.title}
                  </strong>
                  {s.note && <small>{s.note}</small>}
                </span>
              </li>
            );
          })}
        </ol>
        <span className="journey-plane" ref={plane} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M22 12c0-.8-.7-1.5-1.5-1.5H15L9.5 3h-2l2.8 7.5H5.5L3.6 8H2l1.2 4L2 16h1.6l1.9-2.5h4.8L7.5 21h2l5.5-7.5h5.5c.8 0 1.5-.7 1.5-1.5z"
              fill="currentColor"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

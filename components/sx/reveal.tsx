'use client';
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Fades/slides content in when it scrolls into view (legacy theme behaviour).
 * Content is always in the server HTML; a <noscript> rule in the layout keeps it visible without JS.
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}: { as?: ElementType; delay?: number; className?: string; children: ReactNode } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${shown ? 'is-visible' : ''} ${className}`} style={{ animationDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

type Labels = { toggle: string; light: string; dark: string; system: string };

const OPTIONS = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
] as const;

/**
 * Light / dark / system switcher. A small hand-rolled menu (instead of a menu library) keeps it
 * out of every page's JavaScript; keyboard: Enter/Space opens, arrows move, Escape closes.
 */
export function ThemeToggle({ labels }: { labels: Labels }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"], [role="menuitemradio"]')?.focus();
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const items = [...(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div className="theme-menu" ref={root}>
      <button ref={button} type="button" className="icon-btn" aria-label={labels.toggle} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {/* Both icons render; CSS picks one, so there's no hydration mismatch. */}
        <Sun size={18} className="dark:hidden" aria-hidden />
        <Moon size={18} className="hidden dark:block" aria-hidden />
      </button>
      {open && (
        <div className="theme-menu-list" role="menu" aria-label={labels.toggle} onKeyDown={onMenuKey}>
          {OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === value}
              onClick={() => {
                setTheme(value);
                setOpen(false);
                button.current?.focus();
              }}
            >
              <Icon size={16} aria-hidden /> {labels[value]}
              {theme === value && <Check size={15} className="theme-menu-check" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

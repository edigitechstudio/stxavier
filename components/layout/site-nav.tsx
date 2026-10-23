'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react';
import { Flag } from '@/components/brand/flag';
import { DynamicIcon } from '@/components/icons';
import { CounsellingButton } from '@/components/sx/counselling';
import { Link } from '@/i18n/navigation';
import type { NavLink } from './nav-types';

type Labels = { primaryNav: string; getStarted: string; openMenu: string; closeMenu: string; book: string };

function ItemIcon({ item }: { item: NavLink }) {
  return (
    <span className="dropdown-icon">
      {item.flag ? <Flag code={item.flag} /> : <DynamicIcon name={item.icon} className="size-4" />}
    </span>
  );
}

/** Sticky header bar: desktop dropdown nav + mobile drawer (legacy theme). */
export function SiteNav({
  items,
  labels,
  logo,
  actions,
}: {
  items: NavLink[];
  labels: Labels;
  logo: ReactNode;
  actions: ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const close = () => setDrawer(false);

  return (
    <>
      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="wrap header-inner">
          {logo}

          <nav className="nav" aria-label={labels.primaryNav}>
            {items.map((item) => (
              <div className="nav-item" key={item.id}>
                <Link
                  href={item.href ?? '#'}
                  className="nav-link"
                  aria-haspopup={item.children.length ? 'true' : undefined}
                >
                  {item.label}
                  {item.children.length > 0 && <ChevronDown size={15} className="nav-caret" aria-hidden />}
                </Link>
                {item.children.length > 0 && (
                  <div className={`dropdown ${item.children.length > 6 ? 'is-wide' : ''}`}>
                    {item.children.map((c) => (
                      <Link href={c.href ?? '#'} key={c.id} className="dropdown-link">
                        <ItemIcon item={c} />
                        <span>
                          <strong>{c.label}</strong>
                          {c.description && <span className="desc">{c.description}</span>}
                        </span>
                      </Link>
                    ))}
                    {item.viewAll && item.href && (
                      <Link href={item.href} className="dropdown-all">
                        {item.viewAll} <ArrowRight size={16} aria-hidden />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="header-actions">
            {actions}
            <CounsellingButton className="btn btn-primary btn-sm">
              {labels.getStarted} <ArrowRight size={16} aria-hidden />
            </CounsellingButton>
            <button
              className="menu-btn"
              onClick={() => setDrawer(true)}
              aria-label={labels.openMenu}
              aria-expanded={drawer}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Fixed, clipped layer: the closed (off-screen) drawer must not widen the page. */}
      <div className={`drawer-layer ${drawer ? 'is-open' : ''}`}>
        <div className={`drawer-backdrop ${drawer ? 'is-open' : ''}`} onClick={close} aria-hidden />
        <aside
          className={`drawer ${drawer ? 'is-open' : ''}`}
          aria-hidden={!drawer}
          aria-label={labels.primaryNav}
        >
          <div className="drawer-head">
            <span onClick={close}>{logo}</span>
            <button className="menu-btn" onClick={close} aria-label={labels.closeMenu}>
              <X size={22} />
            </button>
          </div>
          <nav className="drawer-nav">
            {items.map((item) => (
              <div key={item.id} className="drawer-item">
                {item.children.length ? (
                  <button
                    className="drawer-link"
                    onClick={() => setOpenSub(openSub === item.id ? null : item.id)}
                    aria-expanded={openSub === item.id}
                  >
                    {item.label}
                    <ChevronDown size={18} className={openSub === item.id ? 'rot' : ''} aria-hidden />
                  </button>
                ) : (
                  <Link href={item.href ?? '/'} className="drawer-link" onClick={close}>
                    {item.label}
                  </Link>
                )}
                {item.children.length > 0 && openSub === item.id && (
                  <div className="drawer-sub">
                    {item.children.map((c) => (
                      <Link href={c.href ?? '#'} key={c.id} onClick={close}>
                        {c.flag ? <Flag code={c.flag} /> : <DynamicIcon name={c.icon} className="size-4" />}
                        {c.label}
                      </Link>
                    ))}
                    {item.viewAll && item.href && (
                      <Link href={item.href} onClick={close} className="font-bold">
                        {item.viewAll} →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div onClick={close}>
            <CounsellingButton className="btn btn-primary btn-block">{labels.book}</CounsellingButton>
          </div>
        </aside>
      </div>
    </>
  );
}

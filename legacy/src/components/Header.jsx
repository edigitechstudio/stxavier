import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X, Phone, Sparkles, ArrowRight } from 'lucide-react';
import { navItems, brand } from '../data';
import { useCounselling } from './ui';

export function Logo({ light = false }) {
  return (
    <a href="#top" className={`logo ${light ? 'is-light' : ''}`} aria-label={`${brand.full} home`}>
      <svg viewBox="0 0 64 64" className="logo-mark" aria-hidden="true">
        <defs>
          <linearGradient id="crest" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1d4ed8" />
            <stop offset="1" stopColor="#0b1f4b" />
          </linearGradient>
        </defs>
        <path d="M32 3 56 12v18c0 15-10 26-24 31C18 56 8 45 8 30V12z" fill="url(#crest)" />
        <path d="M32 8 51 15v15c0 12-8 21-19 25C21 51 13 42 13 30V15z" fill="none" stroke="#f4b23e" strokeWidth="2" />
        <text x="32" y="40" textAnchor="middle" fontFamily="Instrument Serif, Georgia, serif" fontSize="22" fill="#fff">SX</text>
      </svg>
      <span className="logo-text">
        <strong>St. Xavier</strong>
        <small>Educational Network</small>
      </span>
    </a>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [openSub, setOpenSub] = useState(null);
  const { open } = useCounselling();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
  }, [drawer]);

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <p>
            <Sparkles size={14} /> Learn Today, Lead Globally — <b>Applications open for 2027 intakes</b>
          </p>
          <nav aria-label="Utility">
            <a href={`tel:${brand.phone.replace(/\s/g, '')}`}><Phone size={13} /> {brand.phone}</a>
            <a href="#">Student Portal</a>
            <a href="#">Partner Login</a>
          </nav>
        </div>
      </div>

      <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-inner">
          <Logo />

          <nav className="nav" aria-label="Primary">
            {navItems.map((item) => (
              <div className="nav-item" key={item.label}>
                <a href="#" className="nav-link">
                  {item.label}
                  {item.children && <ChevronDown size={15} className="nav-caret" />}
                </a>
                {item.children && (
                  <div className="dropdown">
                    {item.children.map((c) => (
                      <a href="#" key={c.label} className="dropdown-link">
                        <strong>{c.label}</strong>
                        <span>{c.desc}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="header-actions">
            <button className="btn btn-primary btn-sm" onClick={open}>
              Get Started <ArrowRight size={16} />
            </button>
            <button className="menu-btn" onClick={() => setDrawer(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer-backdrop ${drawer ? 'is-open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`drawer ${drawer ? 'is-open' : ''}`} aria-hidden={!drawer}>
        <div className="drawer-head">
          <Logo />
          <button className="menu-btn" onClick={() => setDrawer(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <nav className="drawer-nav">
          {navItems.map((item) => (
            <div key={item.label} className="drawer-item">
              <button
                className="drawer-link"
                onClick={() => setOpenSub(openSub === item.label ? null : item.label)}
                aria-expanded={openSub === item.label}
              >
                {item.label}
                {item.children && <ChevronDown size={18} className={openSub === item.label ? 'rot' : ''} />}
              </button>
              {item.children && openSub === item.label && (
                <div className="drawer-sub">
                  {item.children.map((c) => (
                    <a href="#" key={c.label} onClick={() => setDrawer(false)}>{c.label}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <button className="btn btn-primary btn-block" onClick={() => { setDrawer(false); open(); }}>
          Book Free Counselling
        </button>
      </aside>
    </>
  );
}

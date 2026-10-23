import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Circle, GraduationCap, ClipboardCheck, BookOpenCheck, CalendarCheck, Globe2, Users, Award,
  Building2, Landmark, Layers, BadgeCheck, Compass, Target, Globe, FileCheck2, UserCheck, PenLine,
  Wallet, Plane, MessageCircle, ListChecks, FileText, Stamp, BedDouble, ArrowLeftRight,
} from 'lucide-react';

// Explicit map keeps the bundle tree-shaken while letting data.js reference icons by name.
const icons = {
  GraduationCap, ClipboardCheck, BookOpenCheck, CalendarCheck, Globe2, Users, Award, Building2,
  Landmark, Layers, BadgeCheck, Compass, Target, Globe, FileCheck2, UserCheck, PenLine, Wallet,
  Plane, MessageCircle, ListChecks, FileText, Stamp, BedDouble, ArrowLeftRight,
};

export function Icon({ name, ...props }) {
  const Cmp = icons[name] || Circle;
  return <Cmp aria-hidden="true" {...props} />;
}

/** Fades/slides children in when they enter the viewport. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'is-visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function SectionHead({ eyebrow, title, sub, light = false, align = 'center' }) {
  return (
    <Reveal className={`section-head ${light ? 'is-light' : ''} align-${align}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="section-title">{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </Reveal>
  );
}

/** Image that degrades gracefully to a branded gradient if the source fails. */
export function SafeImg({ src, alt, className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`img-fallback ${className}`} role="img" aria-label={alt} />;
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} {...rest} />;
}

export function Modal({ open, onClose, children, label, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* Lets any section open the counselling form. */
export const CounsellingContext = createContext({ open: () => {} });
export const useCounselling = () => useContext(CounsellingContext);

'use client';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { ArrowUp, CalendarCheck, Phone } from 'lucide-react';
import { useContact, useDefaultWhatsAppHref, useWhatsAppHref } from '@/components/providers/contact-provider';
import { Link } from '@/i18n/navigation';
import { WhatsAppIcon } from './whatsapp-icon';

type Labels = { call: string; whatsapp: string; book: string; whatsappLabel: string; backToTop: string; quickContact: string };

function CtaView({ labels, waHref, extra }: { labels: Labels; waHref: string; extra?: ReactNode }) {
  const { phone } = useContact();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="floating">
        {extra}
        <a href={waHref} target="_blank" rel="noopener" className="fab fab-chat" aria-label={labels.whatsappLabel}>
          <WhatsAppIcon className="size-6" />
        </a>
        <button
          type="button"
          className={`fab fab-top ${showTop ? 'is-shown' : ''}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={labels.backToTop}
          tabIndex={showTop ? 0 : -1}
        >
          <ArrowUp size={20} />
        </button>
      </div>

      <nav className="mobile-bar" aria-label={labels.quickContact}>
        <a href={`tel:${phone}`} className="is-call"><Phone size={20} aria-hidden /> {labels.call}</a>
        <a href={waHref} target="_blank" rel="noopener" className="is-wa"><WhatsAppIcon className="size-5" /> {labels.whatsapp}</a>
        <Link href="/book" className="is-book"><CalendarCheck size={20} aria-hidden /> {labels.book}</Link>
      </nav>
    </>
  );
}

function PageAwareCta({ labels, extra }: { labels: Labels; extra?: ReactNode }) {
  return <CtaView labels={labels} waHref={useWhatsAppHref()} extra={extra} />;
}

function DefaultCta({ labels, extra }: { labels: Labels; extra?: ReactNode }) {
  return <CtaView labels={labels} waHref={useDefaultWhatsAppHref()} extra={extra} />;
}

/**
 * Desktop: floating WhatsApp + back-to-top. Mobile: sticky Call · WhatsApp · Book bar.
 * The prerendered HTML carries the generic WhatsApp message; the page-specific one streams in.
 */
/** `extra` (the AI chat button) sits at the top of the floating stack. */
export function FloatingCta({ labels, extra }: { labels: Labels; extra?: ReactNode }) {
  return (
    <>
      <div className="mobile-bar-spacer" aria-hidden />
      <Suspense fallback={<DefaultCta labels={labels} extra={extra} />}>
        <PageAwareCta labels={labels} extra={extra} />
      </Suspense>
    </>
  );
}

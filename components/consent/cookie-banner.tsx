'use client';
import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CONSENT_OPEN, readConsent, writeConsent, type Consent } from '@/lib/consent';

type Labels = { title: string; body: string; accept: string; reject: string; policy: string };

export function CookieBanner({ labels }: { labels: Labels }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Deferred so the banner never competes with LCP.
    const id = window.setTimeout(() => setOpen(readConsent() === null), 1200);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN, reopen);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener(CONSENT_OPEN, reopen);
    };
  }, []);

  const choose = (value: Consent) => {
    writeConsent(value);
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div role="dialog" aria-live="polite" aria-labelledby="cookie-title" className="cookie">
      <div className="cookie-head">
        <span className="cookie-icon"><Cookie size={20} aria-hidden /></span>
        <div>
          <strong id="cookie-title">{labels.title}</strong>
          <p>
            {labels.body} <Link href="/cookie-policy">{labels.policy}</Link>
          </p>
        </div>
      </div>
      <div className="cookie-actions">
        <button type="button" className="btn btn-primary" onClick={() => choose('all')}>{labels.accept}</button>
        <button type="button" className="btn btn-outline" onClick={() => choose('essential')}>{labels.reject}</button>
      </div>
    </div>
  );
}

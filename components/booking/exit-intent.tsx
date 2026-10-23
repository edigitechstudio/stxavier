'use client';
import { Suspense, useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Modal } from '@/components/sx/modal';
import { useTurnstile } from '@/components/sx/turnstile';
import { readUtm } from '@/lib/utm';
import { isValidNepaliPhone } from '@/lib/validation/phone';

type Option = { value: string; label: string };
type Errors = Partial<Record<'name' | 'phone' | 'email' | 'form', string>>;

const SEEN_KEY = 'sx-exit-intent';
/** Pages where a pop-up would interrupt a task (or already is the offer). */
const SKIP = /^\/(?:en|ne)\/(?:book|enquiry|portal|guides|admin)(?:\/|$)/;
const DESKTOP_DELAY = 10_000;
const MOBILE_DELAY = 20_000;
const MOBILE_DEPTH = 0.6;

const seen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage blocked — the pop-up may show again, which is acceptable */
  }
};

/**
 * Exit-intent offer of a free country guide, once per session. Desktop: cursor leaves through
 * the top of the window after 10 s. Touch: 60 % scroll depth after 20 s.
 */
export function ExitIntent({ destinations }: { destinations: Option[] }) {
  return (
    <Suspense fallback={null}>
      <ExitIntentInner destinations={destinations} />
    </Suspense>
  );
}

function ExitIntentInner({ destinations }: { destinations: Option[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const skip = SKIP.test(pathname) || destinations.length === 0;
  const current = /\/study-in\/([^/]+)/.exec(pathname)?.[1];
  const preset = destinations.some((d) => d.value === current) ? current! : destinations[0]?.value;

  useEffect(() => {
    if (skip || seen()) return;
    const started = Date.now();
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const trigger = () => {
      if (seen() || document.querySelector('.modal-backdrop')) return; // never stack on another modal
      markSeen();
      setOpen(true);
      cleanup();
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0 && Date.now() - started >= DESKTOP_DELAY) trigger();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= MOBILE_DEPTH && Date.now() - started >= MOBILE_DELAY) trigger();
    };
    const cleanup = () => {
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('scroll', onScroll);
    };
    if (coarse) window.addEventListener('scroll', onScroll, { passive: true });
    else document.addEventListener('mouseout', onLeave);
    return cleanup;
  }, [skip]);

  const t = useTranslations('exit');
  if (!open || !preset) return null;
  return (
    <Modal open onClose={() => setOpen(false)} label={t('title')} closeLabel={t('close')}>
      <GuideForm destinations={destinations} preset={preset} onClose={() => setOpen(false)} />
    </Modal>
  );
}

function GuideForm({ destinations, preset, onClose }: { destinations: Option[]; preset: string; onClose: () => void }) {
  const t = useTranslations('exit');
  const tc = useTranslations('counselling');
  const locale = useLocale();
  const turnstile = useTurnstile();
  const [country, setCountry] = useState(preset);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ url: string | null; emailed: boolean } | null>(null);
  const countryName = destinations.find((d) => d.value === country)?.label ?? country;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Errors = {};
    if ((data.name ?? '').trim().length < 2) next.name = tc('invalidName');
    if (!isValidNepaliPhone(data.phone ?? '')) next.phone = tc('invalidPhone');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) next.email = tc('invalidEmail');
    if (!Object.keys(next).length && turnstile.enabled && !turnstile.token) next.form = tc('verifying');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    const { utm, referrer } = readUtm();
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'guide_download',
        name: data.name,
        phone: data.phone,
        email: data.email,
        website: data.website || undefined,
        destination: countryName,
        answers: { guide: country },
        locale,
        page_path: window.location.pathname,
        referrer,
        utm,
        turnstile_token: turnstile.token,
      }),
    }).catch(() => null);
    turnstile.reset();
    setSending(false);
    if (res?.ok) {
      const body = (await res.json()) as { guideUrl?: string };
      setResult({ url: body.guideUrl ?? null, emailed: true });
    } else {
      setErrors({ form: res?.status === 429 ? tc('rateLimited') : tc('error') });
    }
  }

  if (result) {
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={56} aria-hidden />
        <h3>{t('successTitle')}</h3>
        {result.emailed && <p>{t('emailed')}</p>}
        {result.url && (
          <a className="btn btn-primary" href={result.url} target="_blank" rel="noopener">
            <ExternalLink size={18} aria-hidden /> {t('open')}
          </a>
        )}
        <button type="button" className="btn btn-outline" onClick={onClose}>{tc('done')}</button>
      </div>
    );
  }

  return (
    <form className="lead-form exit-form" onSubmit={submit} noValidate>
      <span className="exit-icon"><BookOpen size={26} aria-hidden /></span>
      <h3>{t('title')}</h3>
      <p className="muted">{t('body', { country: countryName })}</p>
      {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
      <div className="hp-field" aria-hidden>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label>
        {t('country')}
        <select name="country" value={country} onChange={(e) => setCountry(e.target.value)}>
          {destinations.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </label>
      <div className="form-row">
        <label>
          {tc('name')}
          <input name="name" autoComplete="name" placeholder={tc('namePlaceholder')} aria-invalid={!!errors.name} required />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label>
          {tc('phone')}
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={tc('phonePlaceholder')} aria-invalid={!!errors.phone} required />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>
      </div>
      <label>
        {t('email')}
        <input name="email" type="email" autoComplete="email" placeholder={tc('emailPlaceholder')} aria-invalid={!!errors.email} required />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>
      {turnstile.element}
      <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={sending}>
        {sending ? <><Loader2 size={18} className="animate-spin" aria-hidden /> {tc('sending')}</> : t('submit')}
      </button>
      <button type="button" className="exit-dismiss" onClick={onClose}>{t('noThanks')}</button>
      <p className="form-note">{tc('privacy')}</p>
    </form>
  );
}

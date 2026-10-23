'use client';
import { useState, type ReactNode } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { readUtm } from '@/lib/utm';
import { isValidNepaliPhone } from '@/lib/validation/phone';
import { useTurnstile } from './turnstile';

export type LeadSource = 'counselling' | 'enquiry' | 'contact' | 'parent' | 'eligibility' | 'event_rsvp' | 'guide_download' | 'booking' | 'chat';
export type LeadPrefill = { destination?: string; intake?: string; field?: string; course?: string; counsellor?: string };
export type LeadOptions = { destinations: string[]; intakes: string[] };

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'form', string>>;

type Props = {
  source: LeadSource;
  options: LeadOptions;
  prefill?: LeadPrefill;
  /** Heading area (eyebrow/title/intro). Omit for a bare form. */
  header?: ReactNode;
  showMessage?: boolean;
  showDestination?: boolean;
  submitLabel?: string;
  onDone?: () => void;
  /** Called after a successful submit; when set, the parent decides what to show next. */
  onSuccess?: () => void;
  /** Extra structured data stored with the lead (e.g. quiz answers). */
  answers?: Record<string, string | number | boolean | null | string[]>;
};

/**
 * Lead capture form used by the counselling pop-up and inline on Contact / For Parents / Test Prep.
 * Validates on the client (Nepali phone rules), then posts to /api/leads with UTM + page context.
 */
export function LeadForm({ source, options, prefill = {}, header, showMessage = false, showDestination = true, submitLabel, onDone, onSuccess, answers }: Props) {
  const t = useTranslations('counselling');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const turnstile = useTurnstile();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Errors = {};
    if ((data.name ?? '').trim().length < 2) next.name = t('invalidName');
    if (!isValidNepaliPhone(data.phone ?? '')) next.phone = t('invalidPhone');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = t('invalidEmail');
    if (!Object.keys(next).length && turnstile.enabled && !turnstile.token) next.form = t('verifying');
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus('sending');
    const { utm, referrer } = readUtm();
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        ...data,
        field: prefill.field,
        course: prefill.course,
        counsellor: prefill.counsellor,
        answers,
        turnstile_token: turnstile.token,
        locale,
        page_path: window.location.pathname,
        referrer,
        utm,
      }),
    }).catch(() => null);
    turnstile.reset(); // tokens are single-use

    if (res?.ok) {
      if (onSuccess) onSuccess();
      else setStatus('done');
    } else {
      setStatus('idle');
      setErrors({ form: res?.status === 429 ? t('rateLimited') : t('error') });
    }
  }

  if (status === 'done') {
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={56} />
        <h3>{t('successTitle')}</h3>
        <p>{t('successBody')}</p>
        {onDone && <button type="button" className="btn btn-primary" onClick={onDone}>{t('done')}</button>}
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate>
      {header}
      {errors.form && <p className="form-error" role="alert">{errors.form}</p>}

      {/* Honeypot — invisible to people, tempting to bots. */}
      <div className="hp-field" aria-hidden>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="form-row">
        <label>
          {t('name')}
          <input name="name" placeholder={t('namePlaceholder')} autoComplete="name" aria-invalid={!!errors.name} required />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label>
          {t('phone')}
          <input name="phone" type="tel" inputMode="tel" placeholder={t('phonePlaceholder')} autoComplete="tel" aria-invalid={!!errors.phone} required />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>
      </div>
      <label>
        {t('email')}
        <input name="email" type="email" placeholder={t('emailPlaceholder')} autoComplete="email" aria-invalid={!!errors.email} />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>
      {showDestination && (
        <div className="form-row">
          <label>
            {t('destination')}
            <select name="destination" defaultValue={prefill.destination ?? ''}>
              <option value="">{t('choose')}</option>
              {options.destinations.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label>
            {t('intake')}
            <select name="intake" defaultValue={prefill.intake ?? ''}>
              <option value="">{t('choose')}</option>
              {options.intakes.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
        </div>
      )}
      {showMessage && (
        <label>
          {t('message')}
          <textarea name="message" rows={4} maxLength={2000} placeholder={t('messagePlaceholder')} />
        </label>
      )}
      {turnstile.element}
      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={status === 'sending'}>
        {status === 'sending' ? <><Loader2 size={18} className="animate-spin" /> {t('sending')}</> : (submitLabel ?? t('submit'))}
      </button>
      <p className="form-note">{t('privacy')}</p>
    </form>
  );
}

'use client';
import { useState } from 'react';
import { Check, Loader2, Send } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTurnstile } from '@/components/sx/turnstile';

type Labels = { email: string; submit: string; success: string; error: string; invalid: string };

export function NewsletterForm({ labels }: { labels: Labels }) {
  const locale = useLocale();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const turnstile = useTurnstile();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState('error');
      setMessage(labels.invalid);
      return;
    }
    setState('loading');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale, website: form.get('website') ?? '', turnstile_token: turnstile.token }),
    }).catch(() => null);
    turnstile.reset();
    setState(res?.ok ? 'done' : 'error');
    setMessage(res?.ok ? labels.success : labels.error);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden />
      <div className="news-form">
        <label htmlFor="newsletter-email" className="sr-only">{labels.email}</label>
        <input id="newsletter-email" name="email" type="email" required autoComplete="email" placeholder={labels.email} disabled={state === 'done'} />
        <button type="submit" className="btn btn-accent btn-sm" disabled={state === 'loading' || state === 'done'}>
          {state === 'loading' ? <Loader2 size={16} className="animate-spin" /> : state === 'done' ? <Check size={16} /> : <Send size={16} />}
          {labels.submit}
        </button>
      </div>
      {turnstile.element}
      <p role="status" className={`news-status ${state === 'error' ? 'is-error' : ''}`}>{message}</p>
    </form>
  );
}

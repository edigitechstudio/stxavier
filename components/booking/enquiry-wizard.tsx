'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, CornerDownLeft, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTurnstile } from '@/components/sx/turnstile';
import { Link } from '@/i18n/navigation';
import { readUtm } from '@/lib/utm';
import { isValidNepaliPhone } from '@/lib/validation/phone';

type Option = { value: string; label: string };
type Props = { needs: Option[]; levels: Option[]; destinations: Option[]; intakes: string[] };

type Key = 'need' | 'destination' | 'level' | 'intake' | 'name' | 'phone' | 'email' | 'message';
type Question =
  | { key: Key; kind: 'choice'; options: Option[]; notSure?: boolean }
  | { key: Key; kind: 'text' | 'tel' | 'email' | 'textarea'; optional?: boolean; autoComplete?: string };

const NOT_SURE = 'not-sure';

/**
 * Conversational enquiry: one question per screen with a progress bar. Choices advance on click;
 * text answers advance with Enter. Ends with a single POST to /api/leads (source "enquiry").
 */
export function EnquiryWizard({ needs, levels, destinations, intakes }: Props) {
  const t = useTranslations('enquiry');
  const tc = useTranslations('counselling');
  const locale = useLocale();
  const turnstile = useTurnstile();

  const questions: Question[] = [
    { key: 'need', kind: 'choice', options: needs },
    { key: 'destination', kind: 'choice', options: destinations, notSure: true },
    { key: 'level', kind: 'choice', options: levels, notSure: true },
    { key: 'intake', kind: 'choice', options: intakes.map((i) => ({ value: i, label: i })), notSure: true },
    { key: 'name', kind: 'text', autoComplete: 'name' },
    { key: 'phone', kind: 'tel', autoComplete: 'tel' },
    { key: 'email', kind: 'email', optional: true, autoComplete: 'email' },
    { key: 'message', kind: 'textarea', optional: true },
  ];

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<Key, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const q = questions[index];
  const last = index === questions.length - 1;
  const progress = Math.round(((index + (status === 'done' ? 1 : 0)) / questions.length) * 100);

  // Move focus to each new question so keyboard and screen-reader users follow along.
  useEffect(() => {
    (field.current ?? panel.current?.querySelector<HTMLElement>('.enquiry-choice.is-selected, .enquiry-choice'))?.focus({ preventScroll: true });
  }, [index]);

  const labelOf = (key: Key, value: string | undefined) => {
    if (!value) return undefined;
    if (value === NOT_SURE) return t('notSure');
    const qq = questions.find((x) => x.key === key);
    return qq && qq.kind === 'choice' ? (qq.options.find((o) => o.value === value)?.label ?? value) : value;
  };

  async function submit(all: Partial<Record<Key, string>>) {
    if (turnstile.enabled && !turnstile.token) {
      setError(tc('verifying'));
      return;
    }
    setStatus('sending');
    const { utm, referrer } = readUtm();
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'enquiry',
        name: all.name,
        phone: all.phone,
        email: all.email ?? '',
        destination: labelOf('destination', all.destination),
        intake: labelOf('intake', all.intake),
        field: labelOf('level', all.level),
        message: all.message || undefined,
        answers: { need: all.need ?? null, destination: all.destination ?? null, level: all.level ?? null, intake: all.intake ?? null },
        locale,
        page_path: window.location.pathname,
        referrer,
        utm,
        turnstile_token: turnstile.token,
        website: (panel.current?.querySelector<HTMLInputElement>('input[name="website"]')?.value ?? '') || undefined,
      }),
    }).catch(() => null);
    turnstile.reset();
    if (res?.ok) setStatus('done');
    else {
      setStatus('idle');
      setError(res?.status === 429 ? tc('rateLimited') : tc('error'));
    }
  }

  function validate(key: Key, value: string): string | null {
    if (key === 'name' && value.trim().length < 2) return tc('invalidName');
    if (key === 'phone' && !isValidNepaliPhone(value)) return tc('invalidPhone');
    if (key === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return tc('invalidEmail');
    return null;
  }

  function advance(value?: string) {
    const v = value ?? answers[q.key] ?? '';
    const problem = q.kind === 'choice' ? (v ? null : tc('choose')) : validate(q.key, v);
    if (problem && !(q.kind !== 'choice' && q.optional && !v)) {
      setError(problem);
      return;
    }
    setError(null);
    if (last) void submit({ ...answers, [q.key]: v });
    else setIndex(index + 1);
  }

  function choose(value: string) {
    setAnswers((a) => ({ ...a, [q.key]: value }));
    advance(value);
  }

  // Letter shortcuts (A, B, C…) for choice questions, like the badges on each option.
  const shortcut = useRef(choose);
  useEffect(() => {
    shortcut.current = choose;
  });
  const choiceValues = q.kind === 'choice' ? [...q.options.map((o) => o.value), ...(q.notSure ? [NOT_SURE] : [])].join('|') : '';
  useEffect(() => {
    if (!choiceValues) return;
    const values = choiceValues.split('|');
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input, textarea, select')) return;
      const i = e.key.toUpperCase().charCodeAt(0) - 65;
      if (e.key.length === 1 && i >= 0 && i < values.length) shortcut.current(values[i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choiceValues]);

  if (status === 'done') {
    return (
      <div className="enquiry" ref={panel}>
        <div className="enquiry-progress" aria-hidden><span style={{ width: '100%' }} /></div>
        <div className="form-success" role="status">
          <CheckCircle2 size={56} aria-hidden />
          <h2 className="enquiry-question">{t('doneTitle', { name: (answers.name ?? '').split(' ')[0] })}</h2>
          <p>{t('doneBody')}</p>
          <Link href="/book" className="btn btn-primary"><CalendarCheck size={18} aria-hidden /> {t('bookNow')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="enquiry" ref={panel}>
      <div className="enquiry-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={t('step', { n: index + 1, total: questions.length })}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="hp-field" aria-hidden>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="enquiry-body" key={q.key}>
        <p className="enquiry-count">{t('step', { n: index + 1, total: questions.length })}</p>
        <h2 className="enquiry-question" id={`q-${q.key}`}>
          {t(`q.${q.key}`)}
          {q.kind !== 'choice' && q.optional && <span className="enquiry-optional">{t('optional')}</span>}
        </h2>

        {q.kind === 'choice' ? (
          <div className="enquiry-choices" role="group" aria-labelledby={`q-${q.key}`}>
            {[...q.options, ...(q.notSure ? [{ value: NOT_SURE, label: t('notSure') }] : [])].map((o, i) => (
              <button key={o.value} type="button" className={`enquiry-choice ${answers[q.key] === o.value ? 'is-selected' : ''}`} onClick={() => choose(o.value)}>
                <kbd aria-hidden>{String.fromCharCode(65 + i)}</kbd> {o.label}
              </button>
            ))}
          </div>
        ) : (
          <form
            className="enquiry-input"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              advance();
            }}
          >
            {q.kind === 'textarea' ? (
              <textarea
                ref={field}
                rows={4}
                maxLength={2000}
                aria-labelledby={`q-${q.key}`}
                value={answers[q.key] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    advance();
                  }
                }}
              />
            ) : (
              <input
                ref={field}
                type={q.kind}
                inputMode={q.kind === 'tel' ? 'tel' : undefined}
                autoComplete={q.autoComplete}
                placeholder={q.key === 'name' ? tc('namePlaceholder') : q.key === 'phone' ? tc('phonePlaceholder') : tc('emailPlaceholder')}
                aria-labelledby={`q-${q.key}`}
                aria-invalid={!!error}
                value={answers[q.key] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
              />
            )}
            {last && turnstile.element}
            <div className="enquiry-actions">
              <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                {status === 'sending' ? <><Loader2 size={18} className="animate-spin" aria-hidden /> {t('sending')}</> : last ? t('submit') : <>{t('next')} <ArrowRight size={16} aria-hidden /></>}
              </button>
              {q.optional && !answers[q.key] && !last && (
                <button type="button" className="btn btn-outline" onClick={() => advance('')}>{t('skip')}</button>
              )}
              <span className="enquiry-enter" aria-hidden><CornerDownLeft size={14} /> {t('pressEnter')}</span>
            </div>
          </form>
        )}
        {error && <p className="field-error enquiry-error" role="alert">{error}</p>}
      </div>

      {index > 0 && (
        <button type="button" className="booking-back" onClick={() => { setError(null); setIndex(index - 1); }}>
          <ArrowLeft size={16} aria-hidden /> {t('back')}
        </button>
      )}
    </div>
  );
}

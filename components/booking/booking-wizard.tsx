'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarCheck, CalendarPlus, CheckCircle2, Download, Loader2, MapPin, MessageCircle, Sparkles, Users, Video } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { SmartImage } from '@/components/sx/smart-image';
import { useTurnstile } from '@/components/sx/turnstile';
import { googleCalendarUrl, icsFile, type CalendarEvent } from '@/lib/booking/calendar';
import { readUtm } from '@/lib/utm';
import { isValidNepaliPhone } from '@/lib/validation/phone';
import type { BookingMode, DaySlots, Slot } from '@/types/booking';

export type BookableCounsellor = { slug: string; name: string; role: string; photo: string | null; languages: string[]; modes: BookingMode[]; isPlaceholder: boolean };
type Props = { counsellors: BookableCounsellor[]; modeNotes: Record<BookingMode, string>; officeAddress: string };

type Step = 0 | 1 | 2 | 3;
type Done = { reference: string; counsellor: { slug: string; name: string }; start: string; end: string; mode: BookingMode; email: string };
type Errors = Partial<Record<'name' | 'phone' | 'email' | 'form', string>>;

const MODE_ICONS = { office: MapPin, zoom: Video, whatsapp: MessageCircle } as const;
const TZ = 'Asia/Kathmandu';

/**
 * Four-step booking: counsellor (or "any") → meeting mode → date + time → details.
 * Slots come live from /api/bookings/slots; the server re-checks the slot on submit and
 * the database refuses overlaps, so two students can never get the same time.
 */
export function BookingWizard(props: Props) {
  const preset = useSearchParams().get('counsellor');
  if (props.counsellors.length === 0) return <BookingUnavailable />;
  const valid = props.counsellors.some((c) => c.slug === preset) ? preset : null;
  // Remount when the ?counsellor= param changes so the preset applies cleanly.
  return <Wizard key={valid ?? 'none'} preset={valid} {...props} />;
}

function Wizard({ counsellors, modeNotes, officeAddress, preset }: Props & { preset: string | null }) {
  const t = useTranslations('booking');
  const tc = useTranslations('counselling');
  const locale = useLocale();
  const fmtLocale = locale === 'ne' ? 'ne-NP' : 'en-GB';
  const turnstile = useTurnstile();

  const [step, setStep] = useState<Step>(preset ? 1 : 0);
  const [counsellor, setCounsellor] = useState<string>(preset ?? 'any');
  const [mode, setMode] = useState<BookingMode | null>(null);
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const top = useRef<HTMLDivElement>(null);

  const chosen = counsellors.find((c) => c.slug === counsellor) ?? null;
  const modes = useMemo<BookingMode[]>(() => {
    const pool = chosen ? [chosen] : counsellors;
    return (['office', 'zoom', 'whatsapp'] as const).filter((m) => pool.some((c) => c.modes.includes(m)));
  }, [chosen, counsellors]);
  const nameOf = (slug: string) => counsellors.find((c) => c.slug === slug)?.name ?? slug;

  const fmt = useMemo(
    () => ({
      weekday: new Intl.DateTimeFormat(fmtLocale, { weekday: 'short', timeZone: TZ }),
      dayNum: new Intl.DateTimeFormat(fmtLocale, { day: 'numeric', timeZone: TZ }),
      month: new Intl.DateTimeFormat(fmtLocale, { month: 'short', timeZone: TZ }),
      long: new Intl.DateTimeFormat(fmtLocale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }),
      time: new Intl.DateTimeFormat(fmtLocale, { hour: 'numeric', minute: '2-digit', timeZone: TZ }),
    }),
    [fmtLocale],
  );
  // A Nepal calendar date (YYYY-MM-DD) as a Date at noon NPT, for formatting only.
  const dateOf = (d: string) => new Date(`${d}T12:00:00+05:45`);
  const whenLabel = (iso: string) => `${fmt.long.format(new Date(iso))} · ${fmt.time.format(new Date(iso))}`;

  const go = (s: Step) => {
    setStep(s);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const loadSlots = useCallback(async (c: string, m: BookingMode, keepDay?: string | null) => {
    setDays(null);
    setLoadError(null);
    const res = await fetch(`/api/bookings/slots?counsellor=${encodeURIComponent(c)}&mode=${m}`, { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) {
      setLoadError(res?.status === 503 ? t('unavailable') : t('error'));
      setDays([]);
      return;
    }
    const data = (await res.json()) as { days: DaySlots[] };
    setDays(data.days);
    setDay(keepDay && data.days.some((d) => d.date === keepDay) ? keepDay : (data.days[0]?.date ?? null));
  }, [t]);

  // Fetch slots whenever the time step opens for a counsellor/mode pair.
  useEffect(() => {
    if (step !== 2 || !mode) return;
    const id = setTimeout(() => void loadSlots(counsellor, mode, day), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `day` is only a hint for reselection
  }, [step, counsellor, mode, loadSlots]);

  function pickCounsellor(slug: string) {
    setCounsellor(slug);
    const pool = slug === 'any' ? counsellors : counsellors.filter((c) => c.slug === slug);
    if (mode && !pool.some((c) => c.modes.includes(mode))) setMode(null);
    setSlot(null);
    go(1);
  }

  function pickMode(m: BookingMode) {
    setMode(m);
    setSlot(null);
    setNotice(null);
    go(2);
  }

  function pickSlot(s: Slot) {
    setSlot(s);
    setNotice(null);
    go(3);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slot || !mode) return;
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Errors = {};
    if ((data.name ?? '').trim().length < 2) next.name = tc('invalidName');
    if (!isValidNepaliPhone(data.phone ?? '')) next.phone = tc('invalidPhone');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = tc('invalidEmail');
    if (!Object.keys(next).length && turnstile.enabled && !turnstile.token) next.form = tc('verifying');
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    const { utm } = readUtm();
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        counsellor: counsellor === 'any' ? 'any' : counsellor,
        mode,
        start: slot.start,
        locale,
        page_path: window.location.pathname,
        utm,
        turnstile_token: turnstile.token,
      }),
    }).catch(() => null);
    turnstile.reset();
    setSending(false);

    if (res?.ok) {
      const body = (await res.json()) as Omit<Done, 'email'>;
      setDone({ ...body, email: data.email ?? '' });
      requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }
    if (res?.status === 409) {
      setSlot(null);
      setNotice(t('conflict'));
      go(2);
      return;
    }
    setErrors({ form: res?.status === 429 ? tc('rateLimited') : res?.status === 503 ? t('unavailable') : t('error') });
  }

  if (done) return <DoneView done={done} reset={() => { setDone(null); setSlot(null); go(0); }} whenLabel={whenLabel} modeNote={modeNotes[done.mode]} officeAddress={officeAddress} />;

  const stepTitles = [t('steps.counsellor'), t('steps.mode'), t('steps.time'), t('steps.details')];
  const currentDay = days?.find((d) => d.date === day) ?? null;

  return (
    <div className="booking" ref={top}>
      <ol className="booking-steps" aria-label={t('step', { n: step + 1, total: 4 })}>
        {stepTitles.map((title, i) => (
          <li key={title} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
            <button type="button" disabled={i >= step} onClick={() => go(i as Step)}>
              <span className="booking-step-num">{i < step ? <CheckCircle2 size={16} aria-hidden /> : i + 1}</span>
              <span className="booking-step-label">{title}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="booking-layout">
        <section className="booking-panel" aria-labelledby="booking-step-title">
          <p className="booking-kicker">{t('step', { n: step + 1, total: 4 })}</p>
          <h2 id="booking-step-title" className="booking-title">{stepTitles[step]}</h2>

          {step === 0 && (
            <div className="booking-options is-people">
              <button type="button" className={`booking-option ${counsellor === 'any' ? 'is-selected' : ''}`} onClick={() => pickCounsellor('any')}>
                <span className="booking-avatar is-any"><Sparkles size={22} aria-hidden /></span>
                <span><strong>{t('any')}</strong><small>{t('anyDesc')}</small></span>
              </button>
              {counsellors.map((c) => (
                <button key={c.slug} type="button" className={`booking-option ${counsellor === c.slug ? 'is-selected' : ''}`} onClick={() => pickCounsellor(c.slug)}>
                  <span className="booking-avatar">
                    {c.photo ? <SmartImage src={c.photo} alt="" fill sizes="56px" /> : <Users size={22} aria-hidden />}
                  </span>
                  <span>
                    <strong>{c.name}{c.isPlaceholder && <span className="todo-badge">TODO</span>}</strong>
                    <small>{c.role}</small>
                    <small className="booking-langs">{c.languages.join(' · ')}</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="booking-options">
              {modes.map((m) => {
                const Icon = MODE_ICONS[m];
                return (
                  <button key={m} type="button" className={`booking-option ${mode === m ? 'is-selected' : ''}`} onClick={() => pickMode(m)}>
                    <span className="booking-avatar is-mode"><Icon size={22} aria-hidden /></span>
                    <span><strong>{t(`modes.${m}`)}</strong><small>{t(`modeDesc.${m}`)}</small></span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="booking-time">
              {notice && <p className="form-error" role="alert">{notice}</p>}
              {days === null ? (
                <p className="booking-loading" role="status"><Loader2 size={18} className="animate-spin" aria-hidden /> {t('loading')}</p>
              ) : loadError ? (
                <p className="form-error" role="alert">{loadError}</p>
              ) : days.length === 0 ? (
                <p className="booking-empty">{t('noDays')}</p>
              ) : (
                <>
                  <div className="booking-days" role="listbox" aria-label={t('steps.time')}>
                    {days.map((d) => {
                      const date = dateOf(d.date);
                      return (
                        <button key={d.date} type="button" role="option" aria-selected={d.date === day} className={`booking-day ${d.date === day ? 'is-selected' : ''}`} onClick={() => setDay(d.date)}>
                          <small>{fmt.weekday.format(date)}</small>
                          <strong>{fmt.dayNum.format(date)}</strong>
                          <small>{fmt.month.format(date)}</small>
                        </button>
                      );
                    })}
                  </div>
                  {currentDay && (
                    <>
                      <p className="booking-slots-for">{t('slotsFor', { date: fmt.long.format(dateOf(currentDay.date)) })}</p>
                      <div className="booking-slots">
                        {currentDay.slots.map((s) => (
                          <button key={s.start} type="button" className={`booking-slot ${slot?.start === s.start ? 'is-selected' : ''}`} onClick={() => pickSlot(s)}>
                            {fmt.time.format(new Date(s.start))}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="booking-tz">{t('timezone')}</p>
                </>
              )}
            </div>
          )}

          {step === 3 && slot && (
            <form className="lead-form" onSubmit={submit} noValidate>
              {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
              <div className="hp-field" aria-hidden>
                <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <div className="form-row">
                <label>
                  {tc('name')}
                  <input name="name" placeholder={tc('namePlaceholder')} autoComplete="name" aria-invalid={!!errors.name} required />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </label>
                <label>
                  {tc('phone')}
                  <input name="phone" type="tel" inputMode="tel" placeholder={tc('phonePlaceholder')} autoComplete="tel" aria-invalid={!!errors.phone} required />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </label>
              </div>
              <label>
                {tc('email')}
                <input name="email" type="email" placeholder={tc('emailPlaceholder')} autoComplete="email" aria-invalid={!!errors.email} aria-describedby="booking-email-hint" />
                <small id="booking-email-hint" className="booking-hint">{t('emailHint')}</small>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>
              <label>
                {t('notes')}
                <textarea name="notes" rows={3} maxLength={1000} placeholder={t('notesPlaceholder')} />
              </label>
              {turnstile.element}
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={sending}>
                {sending ? <><Loader2 size={18} className="animate-spin" aria-hidden /> {t('confirming')}</> : <><CalendarCheck size={18} aria-hidden /> {t('confirm')}</>}
              </button>
              <p className="form-note">{tc('privacy')}</p>
            </form>
          )}

          {step > 0 && (
            <button type="button" className="booking-back" onClick={() => go((step - 1) as Step)}>
              <ArrowLeft size={16} aria-hidden /> {t('back')}
            </button>
          )}
        </section>

        <aside className={`booking-summary ${mode ? '' : 'is-empty'}`} aria-label={t('reference')}>
          <dl>
            <div>
              <dt>{t('summary.counsellor')}</dt>
              <dd>{counsellor === 'any' ? t('any') : nameOf(counsellor)}</dd>
            </div>
            <div>
              <dt>{t('summary.mode')}</dt>
              <dd>{mode ? t(`modes.${mode}`) : '—'}</dd>
            </div>
            <div>
              <dt>{t('summary.when')}</dt>
              <dd>{slot ? whenLabel(slot.start) : '—'}</dd>
            </div>
          </dl>
          {slot && counsellor === 'any' && <p className="booking-hint">{t('anyAssigned')}: {nameOf(slot.counsellor)}</p>}
          {mode && <p className="booking-mode-note">{mode === 'office' ? officeAddress : modeNotes[mode]}</p>}
          <p className="booking-tz">{t('timezone')}</p>
        </aside>
      </div>
    </div>
  );
}

function DoneView({ done, reset, whenLabel, modeNote, officeAddress }: { done: Done; reset: () => void; whenLabel: (iso: string) => string; modeNote: string; officeAddress: string }) {
  const t = useTranslations('booking');
  const event: CalendarEvent = {
    uid: `${done.reference}@stxavier.com.np`,
    title: `${t('email.title')} — St. Xavier (${done.reference})`,
    description: `${t(`modes.${done.mode}`)} ${t('with', { name: done.counsellor.name })}. ${modeNote}\n${t('reference')}: ${done.reference}`,
    location: done.mode === 'office' ? officeAddress : t(`modes.${done.mode}`),
    start: done.start,
    end: done.end,
  };
  const ics = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(event))}`;

  return (
    <div className="booking booking-done" role="status">
      <span className="booking-done-icon"><CheckCircle2 size={44} aria-hidden /></span>
      <h2>{t('doneTitle')}</h2>
      <p>{t('doneBody', { ref: done.reference })}</p>
      <dl className="booking-done-card">
        <div><dt>{t('reference')}</dt><dd className="booking-ref">{done.reference}</dd></div>
        <div><dt>{t('summary.counsellor')}</dt><dd>{done.counsellor.name}</dd></div>
        <div><dt>{t('summary.mode')}</dt><dd>{t(`modes.${done.mode}`)}</dd></div>
        <div><dt>{t('summary.when')}</dt><dd>{whenLabel(done.start)}</dd></div>
      </dl>
      <p className="booking-mode-note">{done.mode === 'office' ? officeAddress : modeNote}</p>
      {done.email && <p className="muted">{t('emailSent', { email: done.email })}</p>}
      <div className="booking-done-actions">
        <a className="btn btn-primary" href={googleCalendarUrl(event)} target="_blank" rel="noopener"><CalendarPlus size={18} aria-hidden /> {t('calendar')}</a>
        <a className="btn btn-outline" href={ics} download={`st-xavier-${done.reference}.ics`}><Download size={18} aria-hidden /> {t('ics')}</a>
      </div>
      <button type="button" className="link-arrow" onClick={reset}>{t('another')} <ArrowRight size={15} aria-hidden /></button>
    </div>
  );
}

function BookingUnavailable() {
  const t = useTranslations('booking');
  return (
    <div className="booking booking-done" role="status">
      <span className="booking-done-icon is-muted"><CalendarCheck size={40} aria-hidden /></span>
      <p>{t('unavailable')}</p>
    </div>
  );
}

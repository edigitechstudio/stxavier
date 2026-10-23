'use client';
import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarPlus, Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { buildIcs, googleCalendarUrl, intakeStart, planTimeline } from '@/lib/calc/timeline';
import { CounsellingButton } from '@/components/sx/counselling';
import { PrintHeader, ToolActions, useFormatters, useQuerySync } from './shared';
import type { ToolDestination } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Next 24 intake months starting from the current month (computed in the browser). */
function upcomingMonths(now: Date) {
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  });
}

export function TimelinePlanner({ destinations }: { destinations: ToolDestination[] }) {
  const t = useTranslations('tools');
  const tt = useTranslations('tools.timeline');
  const locale = useLocale();
  const fmt = useFormatters();
  const usable = destinations.filter((d) => d.timeline.length);
  const [slug, setSlug] = useState(usable[0]?.slug ?? '');
  const [today, setToday] = useState<string | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [intake, setIntake] = useState('');

  useQuerySync(
    (q) => {
      // "Today" and the month list depend on the visitor's clock, so they are computed in the browser.
      const now = new Date();
      const list = upcomingMonths(now);
      setToday(now.toISOString().slice(0, 10));
      setMonths(list);
      const c = q.get('country');
      if (c && usable.some((d) => d.slug === c)) setSlug(c);
      const m = q.get('intake');
      // Default: the first September at least 8 months away.
      setIntake(m && /^\d{4}-\d{2}$/.test(m) ? m : (list.find((x, i) => i >= 8 && x.endsWith('-09')) ?? list[12]));
    },
    { country: slug, intake: intake || undefined },
  );

  const dest = usable.find((d) => d.slug === slug) ?? usable[0];
  const plan = useMemo(() => (dest && intake && today ? planTimeline(intakeStart(intake), dest.timeline.map((s) => ({ ...s, label: { en: s.label }, detail: { en: s.detail } })), today) : []), [dest, intake, today]);
  const monthLabel = (ym: string) => new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${ym}-01T00:00:00Z`));

  if (!dest) return null;
  const events = plan.map((p) => ({
    uid: `${dest.slug}-${intake}-${p.key}@stxavier.com.np`,
    date: p.date,
    title: tt('eventPrefix', { country: dest.name, step: p.label.en }),
    description: `${p.detail.en}\n\nSt. Xavier Educational Network · https://stxavier.com.np`,
  }));

  const downloadIcs = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const blob = new Blob([buildIcs(events, stamp, tt('calendarName', { country: dest.name }))], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `study-plan-${dest.slug}-${intake}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="tool-shell print-area">
      <PrintHeader title={intake ? tt('summary', { country: dest.name, intake: monthLabel(intake) }) : dest.name} />
      <div className="tool-grid">
        <div className="tool-form no-print">
          <label className="field">
            {t('country')}
            <select className="control" value={slug} onChange={(e) => setSlug(e.target.value)}>
              {usable.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
            </select>
          </label>
          <label className="field">
            {tt('intake')}
            <select className="control" value={intake} onChange={(e) => setIntake(e.target.value)} disabled={!months.length}>
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </label>
          {intake && (
            <div className="result-hero">
              <small>{tt('summary', { country: dest.name, intake: monthLabel(intake) })}</small>
              <strong>{fmt.date(intakeStart(intake), 'medium')}</strong>
              <p>{tt('startsOn', { date: fmt.date(intakeStart(intake)) })}</p>
            </div>
          )}
          <ToolActions>
            <button type="button" className="btn btn-primary btn-sm" onClick={downloadIcs} disabled={!plan.length}>
              <Download size={16} aria-hidden /> {tt('ics')}
            </button>
          </ToolActions>
        </div>

        <ol className="plan" aria-live="polite">
          {plan.map((p, i) => (
            <li key={p.key} className={p.isPast ? 'is-past' : ''}>
              <time dateTime={p.date}>{fmt.date(p.date)}</time>
              <strong>{p.label.en}</strong>
              <p>{p.detail.en}</p>
              {p.isPast && (
                <span className="status is-gap" style={{ justifySelf: 'start' }}>
                  <AlertTriangle size={13} aria-hidden /> {tt('past')}
                </span>
              )}
              <a href={googleCalendarUrl(events[i])} target="_blank" rel="noopener" className="no-print inline-flex items-center gap-1">
                <CalendarPlus size={14} aria-hidden /> {tt('google')}
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-4 no-print">
        <CounsellingButton className="btn btn-accent btn-sm" prefill={{ destination: dest.name, intake: intake ? monthLabel(intake) : undefined }}>{t('book')}</CounsellingButton>
      </div>
    </div>
  );
}

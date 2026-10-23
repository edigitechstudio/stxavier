'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { CounsellingButton } from '@/components/sx/counselling';

type Labels = { title: string; body: string; cta: string; days: string; hours: string; minutes: string; closesOn: string; closed: string };

function remaining(deadline: string, now: number) {
  // Deadline is the end of that day in Nepal time (UTC+05:45).
  const end = new Date(`${deadline}T23:59:59+05:45`).getTime();
  const ms = Math.max(end - now, 0);
  return { ms, days: Math.floor(ms / 86_400_000), hours: Math.floor((ms / 3_600_000) % 24), minutes: Math.floor((ms / 60_000) % 60) };
}

/** Intake deadline countdown. The date comes from site settings; time is computed in the browser. */
export function IntakeCountdown({ deadline, dateLabel, intakeLabel, labels }: { deadline: string; dateLabel: string; intakeLabel: string; labels: Labels }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = window.setTimeout(update, 0);
    const id = window.setInterval(update, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const r = now === null ? null : remaining(deadline, now);
  const closed = r !== null && r.ms === 0;

  return (
    <div className="countdown">
      <div className="grid gap-1">
        <h2 className="flex items-center gap-2"><CalendarClock size={24} aria-hidden /> {labels.title}</h2>
        <p>{closed ? labels.closed : labels.closesOn.replace('{label}', intakeLabel).replace('{date}', dateLabel)}</p>
        {!closed && <p>{labels.body}</p>}
      </div>
      {!closed && (
        <div className="countdown-units" aria-live="off">
          {([['days', r?.days], ['hours', r?.hours], ['minutes', r?.minutes]] as const).map(([k, v]) => (
            <div key={k}>
              <strong>{v ?? '–'}</strong>
              <span>{labels[k]}</span>
            </div>
          ))}
        </div>
      )}
      <CounsellingButton className="btn btn-white">
        {labels.cta} <ArrowRight size={16} aria-hidden />
      </CounsellingButton>
    </div>
  );
}

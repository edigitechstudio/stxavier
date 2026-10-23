import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CalendarX, Trash2 } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { MODE_LABEL, WEEKDAYS } from '@/lib/admin/labels';
import { requireStaff } from '@/lib/auth/viewer';
import { getCounsellors } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { readAvailability } from '@/lib/portal/admin';
import { BOOKING_MODES } from '@/types/booking';
import { addClosure, deleteClosure, saveHours } from '../actions';

export const metadata: Metadata = { title: 'Availability' };

export default function AvailabilityPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Availability />
    </Suspense>
  );
}

async function Availability() {
  const viewer = await requireStaff('/admin/availability');
  const [{ rules, exceptions }, team] = await Promise.all([readAvailability(), getCounsellors()]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
  const upcoming = exceptions.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const name = (slug: string | null) => (slug ? (team.find((c) => c.slug === slug)?.name ?? slug) : 'Whole office');

  return (
    <AdminShell section="availability" viewer={viewer} title="Counsellor availability">
      <p className="muted admin-lead">Weekly hours are in Nepal Time. Students can book any free slot inside these hours, from 2 hours ahead up to the booking horizon. Changes apply to the booking page immediately.</p>

      <section className="admin-card">
        <h2>Closures & leave</h2>
        <form action={addClosure} className="admin-filters">
          <label>Date<input type="date" name="date" required min={today} /></label>
          <label>
            Who
            <select name="counsellor" defaultValue="">
              <option value="">Whole office</option>
              {team.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="check"><input type="checkbox" name="all_day" defaultChecked /> All day</label>
          <label>From<input type="time" name="start" defaultValue="10:00" step={900} /></label>
          <label>To<input type="time" name="end" defaultValue="13:00" step={900} /></label>
          <label className="grow">Reason<input name="reason" maxLength={120} placeholder="e.g. Dashain holiday" /></label>
          <button type="submit" className="btn btn-primary btn-sm"><CalendarX size={15} aria-hidden /> Add closure</button>
        </form>
        {upcoming.length === 0 ? (
          <p className="muted">No upcoming closures.</p>
        ) : (
          <ul className="admin-list">
            {upcoming.map((e) => (
              <li key={e.id}>
                <strong className="tabular">{e.date}</strong>
                <span>{name(e.counsellor)} · {e.start ? `${e.start}–${e.end}` : 'All day'}{e.reason ? ` · ${l(e.reason, 'en')}` : ''}</span>
                <form action={deleteClosure}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="icon-btn" aria-label={`Remove closure on ${e.date}`}><Trash2 size={16} /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {team.map((c) => {
        const mine = rules.filter((r) => r.counsellor === c.slug);
        const slot = mine[0]?.slot_minutes ?? 30;
        const modes = new Set(mine.flatMap((r) => r.modes));
        return (
          <section key={c.slug} className="admin-card">
            <h2>{c.name}{c.is_placeholder && <span className="todo-badge">TODO</span>}</h2>
            <form action={saveHours} className="hours-form">
              <input type="hidden" name="counsellor" value={c.slug} />
              <table className="admin-table hours-table">
                <thead><tr><th scope="col">Day</th><th scope="col">Working</th><th scope="col">From</th><th scope="col">To</th></tr></thead>
                <tbody>
                  {WEEKDAYS.map((d, i) => {
                    const r = mine.find((x) => x.weekday === i);
                    return (
                      <tr key={d}>
                        <th scope="row">{d}</th>
                        <td><input type="checkbox" name={`on-${i}`} defaultChecked={!!r} aria-label={`${c.name} works on ${d}`} /></td>
                        <td><input type="time" name={`start-${i}`} defaultValue={r?.start ?? '10:00'} step={900} aria-label={`${d} start`} /></td>
                        <td><input type="time" name={`end-${i}`} defaultValue={r?.end ?? '17:00'} step={900} aria-label={`${d} end`} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="admin-filters">
                <label>
                  Session length
                  <select name="slot" defaultValue={String(slot)}>
                    {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
                  </select>
                </label>
                <fieldset className="check-group">
                  <legend>Meeting types</legend>
                  {BOOKING_MODES.map((m) => (
                    <label key={m} className="check"><input type="checkbox" name="modes" value={m} defaultChecked={mine.length === 0 || modes.has(m)} /> {MODE_LABEL[m]}</label>
                  ))}
                </fieldset>
                <button type="submit" className="btn btn-primary btn-sm">Save hours</button>
              </div>
            </form>
          </section>
        );
      })}
    </AdminShell>
  );
}

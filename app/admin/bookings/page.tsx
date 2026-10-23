import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { BOOKING_STATUS_LABEL, MODE_LABEL, fmtDay, fmtTime } from '@/lib/admin/labels';
import { requireStaff } from '@/lib/auth/viewer';
import { getCounsellors } from '@/lib/content';
import { listBookings } from '@/lib/portal/admin';
import type { BookingStatus } from '@/types/booking';
import type { BookingRow } from '@/types/portal';
import { updateBookingStatus } from '../actions';

export const metadata: Metadata = { title: 'Bookings' };

const RANGES = { upcoming: 'Upcoming', past: 'Past', all: 'All' } as const;
const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

/** Which status changes make sense from each status. */
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
  completed: [],
  cancelled: ['confirmed'],
  no_show: ['completed'],
};

export default function BookingsPage({ searchParams }: PageProps<'/admin/bookings'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Bookings searchParams={searchParams} />
    </Suspense>
  );
}

async function Bookings({ searchParams }: { searchParams: PageProps<'/admin/bookings'>['searchParams'] }) {
  const viewer = await requireStaff('/admin/bookings');
  const sp = await searchParams;
  const range = (Object.keys(RANGES) as (keyof typeof RANGES)[]).find((r) => r === sp.range) ?? 'upcoming';
  const status = STATUSES.find((s) => s === sp.status);
  const [rows, team] = await Promise.all([listBookings(range, status), getCounsellors()]);
  const name = (slug: string) => team.find((c) => c.slug === slug)?.name ?? slug;
  const days = new Map<string, BookingRow[]>();
  for (const b of rows) days.set(fmtDay(b.starts_at), [...(days.get(fmtDay(b.starts_at)) ?? []), b]);
  const href = (r: string, s?: string) => `/admin/bookings?range=${r}${s ? `&status=${s}` : ''}`;

  return (
    <AdminShell section="bookings" viewer={viewer} title="Bookings" actions={<Link href="/admin/availability" className="btn btn-outline btn-sm">Edit availability</Link>}>
      <div className="admin-tabs" role="navigation" aria-label="Booking filters">
        {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((r) => (
          <Link key={r} href={href(r, status)} className={r === range ? 'is-active' : ''} aria-current={r === range ? 'page' : undefined}>{RANGES[r]}</Link>
        ))}
        <span className="admin-tabs-sep" aria-hidden />
        <Link href={href(range)} className={!status ? 'is-active' : ''}>Any status</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={href(range, s)} className={s === status ? 'is-active' : ''}>{BOOKING_STATUS_LABEL[s]}</Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <section className="admin-card"><p className="muted">No bookings here yet. New bookings from the website’s /book page appear automatically.</p></section>
      ) : (
        [...days].map(([day, list]) => (
          <section key={day} className="admin-card">
            <h2>{day}</h2>
            <ul className="booking-rows">
              {list.map((b) => (
                <li key={b.id} className={`is-${b.status}`}>
                  <strong className="tabular">{fmtTime(b.starts_at)}–{fmtTime(b.ends_at)}</strong>
                  <div>
                    <strong>{b.name}</strong> <small className="muted">{b.reference}</small>
                    <small>
                      <a href={`tel:${b.phone}`}>{b.phone}</a>
                      {b.email && <> · <a href={`mailto:${b.email}`}>{b.email}</a></>}
                    </small>
                    {b.notes && <small className="muted">“{b.notes}”</small>}
                  </div>
                  <span>{MODE_LABEL[b.mode]}<small className="muted">{name(b.counsellor)}</small></span>
                  <span className={`badge is-${b.status}`}>{BOOKING_STATUS_LABEL[b.status]}</span>
                  <form action={updateBookingStatus} className="row-actions">
                    <input type="hidden" name="id" value={b.id} />
                    {NEXT[b.status].map((s) => (
                      <button key={s} type="submit" name="status" value={s} className={`btn btn-sm ${s === 'confirmed' || s === 'completed' ? 'btn-primary' : 'btn-outline'}`}>
                        {s === 'confirmed' ? 'Confirm' : s === 'cancelled' ? 'Cancel' : s === 'completed' ? 'Completed' : 'No-show'}
                      </button>
                    ))}
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </AdminShell>
  );
}

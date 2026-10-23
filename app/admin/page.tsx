import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, FileClock, Inbox, TrendingUp } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { BOOKING_STATUS_LABEL, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, MODE_LABEL, STAGE_LABEL, fmtDateTime, fmtTime } from '@/lib/admin/labels';
import { requireStaff } from '@/lib/auth/viewer';
import { getCounsellors } from '@/lib/content';
import { overview } from '@/lib/portal/admin';
import { APP_STAGES, LEAD_STATUSES } from '@/types/portal';

export const metadata: Metadata = { title: 'Overview' };

export default function AdminHome({ searchParams }: PageProps<'/admin'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: { searchParams: PageProps<'/admin'>['searchParams'] }) {
  const viewer = await requireStaff('/admin');
  const [o, team, sp] = await Promise.all([overview(), getCounsellors(), searchParams]);
  const name = (slug: string) => team.find((c) => c.slug === slug)?.name ?? slug;
  const maxStage = Math.max(1, ...Object.values(o.appsByStage));

  return (
    <AdminShell section="overview" viewer={viewer} title={`Hello, ${viewer.name.split(' ')[0]}`}>
      {sp.error === 'admin_only' && <p className="form-error" role="alert">That page is for admins only.</p>}

      <div className="stat-grid">
        <Link href="/admin/leads?status=new" className="stat-tile">
          <Inbox size={20} aria-hidden />
          <strong>{o.newLeads}</strong>
          <span>New leads to contact</span>
        </Link>
        <Link href="/admin/leads" className="stat-tile">
          <TrendingUp size={20} aria-hidden />
          <strong>{o.leadsThisWeek}</strong>
          <span>Leads in the last 7 days</span>
        </Link>
        <Link href="/admin/bookings" className="stat-tile">
          <CalendarDays size={20} aria-hidden />
          <strong>{o.bookingsUpcoming}</strong>
          <span>Upcoming sessions · {o.pendingBookings} to confirm</span>
        </Link>
        <Link href="/admin/applications" className="stat-tile">
          <FileClock size={20} aria-hidden />
          <strong>{o.pendingDocs}</strong>
          <span>Documents awaiting review</span>
        </Link>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Today’s sessions</h2>
          {o.bookingsToday.length === 0 ? (
            <p className="muted">No sessions booked for today.</p>
          ) : (
            <ul className="admin-list">
              {o.bookingsToday.map((b) => (
                <li key={b.id}>
                  <strong className="tabular">{fmtTime(b.starts_at)}</strong>
                  <span>{b.name} · {MODE_LABEL[b.mode]} · {name(b.counsellor)}</span>
                  <span className={`badge is-${b.status}`}>{BOOKING_STATUS_LABEL[b.status]}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/bookings" className="link-arrow">All bookings <ArrowRight size={14} aria-hidden /></Link>
        </section>

        <section className="admin-card">
          <h2>Application pipeline</h2>
          <ul className="pipeline">
            {APP_STAGES.map((s) => (
              <li key={s}>
                <Link href={`/admin/applications?stage=${s}`}>
                  <span>{STAGE_LABEL[s]}</span>
                  <span className="pipeline-bar" aria-hidden><span style={{ width: `${(o.appsByStage[s] / maxStage) * 100}%` }} /></span>
                  <strong className="tabular">{o.appsByStage[s]}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Latest leads</h2>
          <div className="lead-status-row">
            {LEAD_STATUSES.map((s) => (
              <Link key={s} href={`/admin/leads?status=${s}`} className={`badge is-${s}`}>
                {LEAD_STATUS_LABEL[s]} · {o.leadsByStatus[s]}
              </Link>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Source</th><th scope="col">Status</th><th scope="col">Received</th></tr>
            </thead>
            <tbody>
              {o.recentLeads.map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/admin/leads/${l.id}`}>{l.name}</Link><small>{l.phone}</small></td>
                  <td>{LEAD_SOURCE_LABEL[l.source]}</td>
                  <td><span className={`badge is-${l.status}`}>{LEAD_STATUS_LABEL[l.status]}</span></td>
                  <td>{fmtDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

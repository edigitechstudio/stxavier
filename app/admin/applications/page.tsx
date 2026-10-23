import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Filter, Plus } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { STAGE_LABEL, fmtDate } from '@/lib/admin/labels';
import { requireStaff } from '@/lib/auth/viewer';
import { getCounsellors, getDestinations } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { listApplications } from '@/lib/portal/admin';
import { APP_STAGES, stageIndex, type AppStage } from '@/types/portal';
import { newApplication } from '../actions';

export const metadata: Metadata = { title: 'Applications' };

export default function ApplicationsPage({ searchParams }: PageProps<'/admin/applications'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Applications searchParams={searchParams} />
    </Suspense>
  );
}

async function Applications({ searchParams }: { searchParams: PageProps<'/admin/applications'>['searchParams'] }) {
  const viewer = await requireStaff('/admin/applications');
  const sp = await searchParams;
  const stage = APP_STAGES.find((s) => s === sp.stage) as AppStage | undefined;
  const q = typeof sp.q === 'string' ? sp.q.slice(0, 80) : undefined;
  const [apps, destinations, team] = await Promise.all([listApplications({ stage, q }), getDestinations(), getCounsellors()]);
  const country = (slug: string) => l(destinations.find((d) => d.slug === slug)?.name, 'en') ?? slug;
  const name = (slug: string | null) => (slug ? (team.find((c) => c.slug === slug)?.name ?? slug) : '—');

  return (
    <AdminShell section="applications" viewer={viewer} title="Applications">
      <details className="admin-card admin-new" open={sp.new === '1'}>
        <summary><Plus size={16} aria-hidden /> New application</summary>
        <form action={newApplication} className="lead-form">
          <p className="muted">If the student has no portal account yet, they’ll receive an email invitation to sign in.</p>
          <div className="form-row">
            <label>Student email<input type="email" name="email" required autoComplete="off" /></label>
            <label>Student name<input name="name" maxLength={120} /></label>
          </div>
          <div className="form-row">
            <label>
              Country
              <select name="country" required>
                {destinations.map((d) => <option key={d.slug} value={d.slug}>{l(d.name, 'en')}</option>)}
              </select>
            </label>
            <label>
              Counsellor
              <select name="counsellor" defaultValue="">
                <option value="">Unassigned</option>
                {team.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>University<input name="university" maxLength={200} /></label>
            <label>Course<input name="course" maxLength={200} /></label>
          </div>
          <label>Intake<input name="intake" maxLength={60} placeholder="e.g. September 2027" /></label>
          <button type="submit" className="btn btn-primary justify-self-start">Create application</button>
        </form>
      </details>

      <form className="admin-filters" method="get" role="search" aria-label="Filter applications">
        <label>Search<input type="search" name="q" defaultValue={q} placeholder="Student, university or course" /></label>
        <label>
          Stage
          <select name="stage" defaultValue={stage ?? ''}>
            <option value="">All stages</option>
            {APP_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </label>
        <button type="submit" className="btn btn-primary btn-sm"><Filter size={15} aria-hidden /> Apply</button>
        {(stage || q) && <Link href="/admin/applications" className="link-arrow">Clear</Link>}
      </form>

      <div className="table-wrap admin-card">
        <table className="admin-table">
          <thead>
            <tr><th scope="col">Student</th><th scope="col">Destination</th><th scope="col">Stage</th><th scope="col">Counsellor</th><th scope="col">Updated</th></tr>
          </thead>
          <tbody>
            {apps.length === 0 && <tr><td colSpan={5} className="muted">No applications found.</td></tr>}
            {apps.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/admin/applications/${a.id}`}>{a.student_name ?? a.student_email}</Link><small>{a.student_email}</small></td>
                <td>{a.university ?? '—'}<small>{[a.course, country(a.country), a.intake].filter(Boolean).join(' · ')}</small></td>
                <td>
                  <span className="stage-mini" role="img" aria-label={`Stage ${stageIndex(a.stage) + 1} of ${APP_STAGES.length}`}>
                    {APP_STAGES.map((s, i) => <i key={s} className={i <= stageIndex(a.stage) ? 'is-on' : ''} />)}
                  </span>
                  {STAGE_LABEL[a.stage]}
                </td>
                <td>{name(a.counsellor)}</td>
                <td className="nowrap">{fmtDate(a.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

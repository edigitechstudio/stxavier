import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Bell, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { StageTracker } from '@/components/portal/stage-tracker';
import { StatusChip } from '@/components/portal/status-chip';
import { DOC_STATUS_LABEL, STAGE_LABEL, fmtDate, fmtDateTime } from '@/lib/admin/labels';
import { requireStaff } from '@/lib/auth/viewer';
import { getCounsellors, getDestinations, getPageContent } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { getApplication } from '@/lib/portal/admin';
import { APP_STAGES } from '@/types/portal';
import { changeStage, editApplication, reviewDoc, sendNotice } from '../../actions';

export const metadata: Metadata = { title: 'Application' };

export default function ApplicationPage({ params, searchParams }: PageProps<'/admin/applications/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Detail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Detail({ params, searchParams }: Pick<PageProps<'/admin/applications/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params;
  const viewer = await requireStaff(`/admin/applications/${id}`);
  const [data, sp, destinations, team, content] = await Promise.all([getApplication(id), searchParams, getDestinations(), getCounsellors(), getPageContent('portal')]);
  if (!data) notFound();
  const { app, history, documents, notifications } = data;
  const country = l(destinations.find((d) => d.slug === app.country)?.name, 'en') ?? app.country;
  const docLabel = (k: string) => l(content.document_types.find((t) => t.key === k)?.label, 'en') ?? k;
  const required = content.document_types.filter((t) => t.required);
  const missing = required.filter((t) => !documents.some((d) => d.doc_type === t.key && d.status !== 'reupload_needed'));

  return (
    <AdminShell
      section="applications"
      viewer={viewer}
      title={app.student_name ?? app.student_email ?? 'Application'}
      actions={<Link href="/admin/applications" className="link-arrow"><ArrowLeft size={15} aria-hidden /> All applications</Link>}
    >
      {sp.invited === '1' && <p className="notice-ok" role="status">Application created. The student has been emailed an invitation to the portal.</p>}

      <section className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>{app.university ?? country}</h2>
            <p className="muted">{[app.course, country, app.intake].filter(Boolean).join(' · ')} · <a href={`mailto:${app.student_email}`}>{app.student_email}</a></p>
          </div>
        </div>
        <StageTracker stage={app.stage} labels={STAGE_LABEL} compact />
        <form action={changeStage} className="admin-filters">
          <input type="hidden" name="id" value={app.id} />
          <label>
            Move to stage
            <select name="stage" defaultValue={APP_STAGES[Math.min(APP_STAGES.indexOf(app.stage) + 1, APP_STAGES.length - 1)]}>
              {APP_STAGES.map((s) => <option key={s} value={s} disabled={s === app.stage}>{STAGE_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="grow">Note for the student (optional)<input name="note" maxLength={300} placeholder="Shown in the student’s timeline and notification" /></label>
          <button type="submit" className="btn btn-primary btn-sm">Update stage</button>
        </form>
      </section>

      <div className="admin-grid is-wide-left">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Documents</h2>
            <span className="muted">{required.length - missing.length} of {required.length} required received</span>
          </div>
          {missing.length > 0 && <p className="notice-warn">Missing: {missing.map((m) => l(m.label, 'en')).join(', ')}</p>}
          {documents.length === 0 ? (
            <p className="muted">The student hasn’t uploaded anything yet.</p>
          ) : (
            <ul className="doc-review-list">
              {documents.map((d) => (
                <li key={d.id}>
                  <div className="review-head">
                    <div>
                      <strong>{docLabel(d.doc_type)}</strong>
                      <small className="muted">{d.file_name} · {fmtDateTime(d.created_at)}</small>
                    </div>
                    <StatusChip status={d.status} label={DOC_STATUS_LABEL[d.status]} />
                    <a href={`/api/portal/documents/${d.id}`} className="icon-btn" aria-label={`Download ${d.file_name}`}><Download size={17} /></a>
                  </div>
                  <form action={reviewDoc} className="review-form">
                    <input type="hidden" name="id" value={d.id} />
                    <label className="grow">
                      <span className="sr-only">Comment for the student</span>
                      <input name="comment" defaultValue={d.counsellor_comment ?? ''} maxLength={500} placeholder="Comment (required when asking for a re-upload)" />
                    </label>
                    <button type="submit" name="status" value="verified" className="btn btn-sm btn-primary" disabled={d.status === 'verified'}><CheckCircle2 size={15} aria-hidden /> Verify</button>
                    <button type="submit" name="status" value="reupload_needed" className="btn btn-sm btn-outline"><RefreshCw size={15} aria-hidden /> Ask to re-upload</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6 content-start">
          <section className="admin-card">
            <h2>Details</h2>
            <form action={editApplication} className="lead-form">
              <input type="hidden" name="id" value={app.id} />
              <label>University<input name="university" defaultValue={app.university ?? ''} maxLength={200} /></label>
              <label>Course<input name="course" defaultValue={app.course ?? ''} maxLength={200} /></label>
              <label>Intake<input name="intake" defaultValue={app.intake ?? ''} maxLength={60} /></label>
              <label>
                Counsellor
                <select name="counsellor" defaultValue={app.counsellor ?? ''}>
                  <option value="">Unassigned</option>
                  {team.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <button type="submit" className="btn btn-outline btn-sm justify-self-start">Save details</button>
            </form>
          </section>

          <section className="admin-card">
            <h2><Bell size={18} aria-hidden /> Notify the student</h2>
            <form action={sendNotice} className="lead-form">
              <input type="hidden" name="student" value={app.student_id} />
              <label>
                Type
                <select name="kind" defaultValue="deadline">
                  <option value="deadline">Deadline</option>
                  <option value="message">Message</option>
                </select>
              </label>
              <label>Title<input name="title" required maxLength={200} placeholder="e.g. Pay your tuition deposit" /></label>
              <label>Details<textarea name="body" rows={2} maxLength={1000} /></label>
              <label>Due date (deadlines)<input type="date" name="due" /></label>
              <button type="submit" className="btn btn-primary btn-sm justify-self-start">Send notification</button>
            </form>
            {notifications.length > 0 && (
              <ul className="note-list">
                {notifications.slice(0, 6).map((n) => (
                  <li key={n.id}>
                    <p><strong>{n.title}</strong>{n.due_at && <> · due {fmtDate(n.due_at)}</>}</p>
                    <small className="muted">{fmtDateTime(n.created_at)} · {n.read_at ? 'read' : 'unread'}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-card">
            <h2>Timeline</h2>
            <ul className="note-list">
              {history.map((h) => (
                <li key={h.id}>
                  <p><strong>{STAGE_LABEL[h.to_stage]}</strong>{h.note && <> — {h.note}</>}</p>
                  <small className="muted">{h.changed_by_name ?? 'Staff'} · {fmtDateTime(h.created_at)}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

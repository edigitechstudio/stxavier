import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, fmtDateTime } from '@/lib/admin/labels';
import { requireStaff } from '@/lib/auth/viewer';
import { getLead } from '@/lib/portal/admin';
import { LEAD_STATUSES } from '@/types/portal';
import { addNote, updateLeadStatus } from '../../actions';

export const metadata: Metadata = { title: 'Lead' };

export default function LeadPage({ params }: PageProps<'/admin/leads/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <LeadDetail params={params} />
    </Suspense>
  );
}

const pretty = (k: string) => k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const show = (v: unknown): string => (v == null || v === '' ? '' : typeof v === 'object' ? Object.entries(v as Record<string, unknown>).filter(([, x]) => x != null && x !== '').map(([k, x]) => `${pretty(k)}: ${show(x)}`).join(' · ') : String(v));

async function LeadDetail({ params }: { params: PageProps<'/admin/leads/[id]'>['params'] }) {
  const { id } = await params;
  const viewer = await requireStaff(`/admin/leads/${id}`);
  const data = await getLead(id);
  if (!data) notFound();
  const { lead, notes } = data;
  const wa = `https://wa.me/${lead.phone.replace(/\D/g, '').replace(/^(?=9[78]\d{8}$)/, '977')}`;
  const details = Object.entries(lead.payload).map(([k, v]) => [pretty(k), show(v)] as const).filter(([, v]) => v);
  const utm = [['Source', lead.utm_source], ['Medium', lead.utm_medium], ['Campaign', lead.utm_campaign], ['Term', lead.utm_term], ['Content', lead.utm_content]].filter(([, v]) => v);

  return (
    <AdminShell section="leads" viewer={viewer} title={lead.name} actions={<Link href="/admin/leads" className="link-arrow"><ArrowLeft size={15} aria-hidden /> All leads</Link>}>
      <div className="admin-grid is-wide-left">
        <div className="grid gap-6">
          <section className="admin-card">
            <div className="contact-actions">
              <a href={`tel:${lead.phone}`} className="btn btn-primary btn-sm"><Phone size={15} aria-hidden /> {lead.phone}</a>
              <a href={wa} target="_blank" rel="noopener" className="btn btn-outline btn-sm"><MessageCircle size={15} aria-hidden /> WhatsApp</a>
              {lead.email && <a href={`mailto:${lead.email}`} className="btn btn-outline btn-sm"><Mail size={15} aria-hidden /> {lead.email}</a>}
            </div>
            <dl className="kv">
              <div><dt>Source</dt><dd>{LEAD_SOURCE_LABEL[lead.source]}</dd></div>
              <div><dt>Received</dt><dd>{fmtDateTime(lead.created_at)}</dd></div>
              {lead.page_path && <div><dt>Page</dt><dd>{lead.page_path}</dd></div>}
              {lead.referrer && <div><dt>Referrer</dt><dd className="break">{lead.referrer}</dd></div>}
              {lead.locale && <div><dt>Language</dt><dd>{lead.locale === 'ne' ? 'Nepali' : 'English'}</dd></div>}
              {details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            {utm.length > 0 && (
              <>
                <h3 className="admin-sub">Campaign (UTM)</h3>
                <dl className="kv">{utm.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              </>
            )}
          </section>

          <section className="admin-card">
            <h2>Notes</h2>
            <form action={addNote} className="lead-form">
              <input type="hidden" name="id" value={lead.id} />
              <label>
                <span className="sr-only">Add a note</span>
                <textarea name="body" rows={3} maxLength={4000} required placeholder="Call outcome, next step, documents discussed…" />
              </label>
              <button type="submit" className="btn btn-primary btn-sm justify-self-start">Add note</button>
            </form>
            {notes.length === 0 ? (
              <p className="muted">No notes yet.</p>
            ) : (
              <ul className="note-list">
                {notes.map((n) => (
                  <li key={n.id}>
                    <p>{n.body}</p>
                    <small className="muted">{n.author_name ?? 'Staff'} · {fmtDateTime(n.created_at)}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="admin-card">
          <h2>Status</h2>
          <p><span className={`badge is-${lead.status}`}>{LEAD_STATUS_LABEL[lead.status]}</span></p>
          <form action={updateLeadStatus} className="status-buttons">
            <input type="hidden" name="id" value={lead.id} />
            {LEAD_STATUSES.filter((s) => s !== lead.status).map((s) => (
              <button key={s} type="submit" name="status" value={s} className="btn btn-outline btn-sm">
                Mark {LEAD_STATUS_LABEL[s].toLowerCase()}
              </button>
            ))}
          </form>
        </aside>
      </div>
    </AdminShell>
  );
}

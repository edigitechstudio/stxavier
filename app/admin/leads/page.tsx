import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Download, Filter } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { parseLeadFilter } from '@/lib/admin/filters';
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, fmtDateTime } from '@/lib/admin/labels';
import { requireStaff } from '@/lib/auth/viewer';
import { LEAD_LIMIT, listLeads } from '@/lib/portal/admin';
import { LEAD_SOURCES, LEAD_STATUSES } from '@/types/portal';

export const metadata: Metadata = { title: 'Leads' };

export default function LeadsPage({ searchParams }: PageProps<'/admin/leads'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Leads searchParams={searchParams} />
    </Suspense>
  );
}

const summary = (p: Record<string, unknown>) => {
  const v = [p.destination, p.intake, p.field, p.course, p.message].filter((x) => typeof x === 'string' && x).join(' · ');
  return v.length > 90 ? `${v.slice(0, 89)}…` : v;
};

async function Leads({ searchParams }: { searchParams: PageProps<'/admin/leads'>['searchParams'] }) {
  const viewer = await requireStaff('/admin/leads');
  const sp = await searchParams;
  const f = parseLeadFilter(sp);
  const leads = await listLeads(f);
  const query = new URLSearchParams(Object.entries({ status: f.status, source: f.source, q: f.q, from: f.fromDay, to: f.toDay }).filter(([, v]) => v) as [string, string][]);

  return (
    <AdminShell
      section="leads"
      viewer={viewer}
      title="Leads"
      actions={
        <a href={`/api/admin/leads/export?${query}`} className="btn btn-outline btn-sm" download>
          <Download size={16} aria-hidden /> Export CSV
        </a>
      }
    >
      <form className="admin-filters" method="get" role="search" aria-label="Filter leads">
        <label>
          Search
          <input type="search" name="q" defaultValue={f.q} placeholder="Name, phone or email" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={f.status ?? ''}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label>
          Source
          <select name="source" defaultValue={f.source ?? ''}>
            <option value="">All sources</option>
            {LEAD_SOURCES.map((s) => <option key={s} value={s}>{LEAD_SOURCE_LABEL[s]}</option>)}
          </select>
        </label>
        <label>
          From
          <input type="date" name="from" defaultValue={f.fromDay} />
        </label>
        <label>
          To
          <input type="date" name="to" defaultValue={f.toDay} />
        </label>
        <button type="submit" className="btn btn-primary btn-sm"><Filter size={15} aria-hidden /> Apply</button>
        {query.size > 0 && <Link href="/admin/leads" className="link-arrow">Clear</Link>}
      </form>

      <p className="muted admin-count" role="status">
        {leads.length === LEAD_LIMIT ? `Showing the latest ${LEAD_LIMIT}. Narrow the filters or export CSV for all.` : `${leads.length} lead${leads.length === 1 ? '' : 's'}`}
      </p>

      <div className="table-wrap admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Source</th>
              <th scope="col">Interest</th>
              <th scope="col">Campaign</th>
              <th scope="col">Status</th>
              <th scope="col">Received</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr><td colSpan={6} className="muted">No leads match these filters.</td></tr>
            )}
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link href={`/admin/leads/${l.id}`}>{l.name}</Link>
                  <small>{l.phone}{l.email ? ` · ${l.email}` : ''}</small>
                </td>
                <td>{LEAD_SOURCE_LABEL[l.source]}</td>
                <td className="muted">{summary(l.payload) || '-'}</td>
                <td className="muted">{[l.utm_source, l.utm_campaign].filter(Boolean).join(' / ') || '-'}</td>
                <td><span className={`badge is-${l.status}`}>{LEAD_STATUS_LABEL[l.status]}</span></td>
                <td className="nowrap">{fmtDateTime(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

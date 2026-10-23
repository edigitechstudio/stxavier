import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, Pencil, Plus } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { requireAdmin } from '@/lib/auth/viewer';
import { collection, pageInfo } from '@/lib/cms/collections';
import { listEntries } from '@/lib/cms/store';

export const metadata: Metadata = { title: 'Website content' };

export default function CollectionPage({ params, searchParams }: PageProps<'/admin/cms/[collection]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <List params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function List({ params, searchParams }: Pick<PageProps<'/admin/cms/[collection]'>, 'params' | 'searchParams'>) {
  const [{ collection: key }, sp] = await Promise.all([params, searchParams]);
  const viewer = await requireAdmin();
  const c = collection(key);
  if (!c) notFound();
  if (c.kind === 'site') redirect('/admin/cms/site/main');
  const q = typeof sp.q === 'string' ? sp.q.toLowerCase() : '';
  let rows = await listEntries(c);
  if (c.kind === 'pages') rows = rows.map((r) => ({ ...r, title: pageInfo(r.id).label })).sort((a, b) => a.title.localeCompare(b.title));
  if (q) rows = rows.filter((r) => `${r.title} ${r.id}`.toLowerCase().includes(q));
  const href = (id: string) => `/admin/cms/${c.key}/${encodeURIComponent(id)}`;
  const view = (id: string) => (c.kind === 'pages' ? pageInfo(id).path : c.path?.(id));

  return (
    <AdminShell
      section="content"
      viewer={viewer}
      title={c.label}
      actions={
        <>
          <Link href="/admin/cms" className="link-arrow"><ArrowLeft size={15} aria-hidden /> All content</Link>
          {c.creatable && <Link href={`${href('new')}`} className="btn btn-primary btn-sm"><Plus size={15} aria-hidden /> New</Link>}
        </>
      }
    >
      <p className="muted admin-lead">{c.description}</p>
      {sp.deleted === '1' && <p className="notice-ok" role="status">Deleted.</p>}
      {typeof sp.error === 'string' && <p className="form-error" role="alert">{sp.error}</p>}

      <form className="admin-filters" method="get" role="search">
        <label className="grow">Search<input type="search" name="q" defaultValue={q} placeholder="Name or id" /></label>
        <button type="submit" className="btn btn-outline btn-sm">Search</button>
      </form>

      <div className="table-wrap admin-card">
        <table className="admin-table">
          <thead>
            <tr><th scope="col">Entry</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={3} className="muted">Nothing here yet.</td></tr>}
            {rows.map((r) => {
              const path = view(r.id);
              return (
                <tr key={r.id}>
                  <td>
                    <Link href={href(r.id)}>{r.title}</Link>
                    <small>{r.id}{r.note ? ` · ${r.note}` : ''}</small>
                  </td>
                  <td>
                    {r.published === false ? <span className="badge is-lost">Hidden</span> : r.published ? <span className="badge is-converted">Published</span> : <span className="badge">Live</span>}
                    {r.placeholder && <span className="todo-badge">Placeholder</span>}
                  </td>
                  <td className="nowrap">
                    <span className="row-actions">
                      <Link href={href(r.id)} className="btn btn-outline btn-sm"><Pencil size={14} aria-hidden /> Edit</Link>
                      {c.creatable && c.kind !== 'blog' && <Link href={`${href('new')}?from=${encodeURIComponent(r.id)}`} className="icon-btn" aria-label={`Duplicate ${r.title}`} title="Duplicate"><Copy size={15} /></Link>}
                      {path && <a href={`/en${path === '/' ? '' : path}`} target="_blank" rel="noopener" className="icon-btn" aria-label={`View ${r.title} on the site`} title="View on site"><ExternalLink size={15} /></a>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

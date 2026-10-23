import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { ConfirmSubmit } from '@/components/admin/cms/confirm-submit';
import { EntryEditor } from '@/components/admin/cms/entry-editor';
import { requireAdmin } from '@/lib/auth/viewer';
import { collection, pageInfo } from '@/lib/cms/collections';
import { blank, titleOf } from '@/lib/cms/shape';
import { getEntry, shapeFor } from '@/lib/cms/store';
import { deleteEntryAction } from '../../actions';

export const metadata: Metadata = { title: 'Edit content' };

export default function EntryPage({ params, searchParams }: PageProps<'/admin/cms/[collection]/[id]'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Editor({ params, searchParams }: Pick<PageProps<'/admin/cms/[collection]/[id]'>, 'params' | 'searchParams'>) {
  const [{ collection: key, id: rawId }, sp] = await Promise.all([params, searchParams]);
  const viewer = await requireAdmin();
  const c = collection(key);
  if (!c) notFound();
  const id = decodeURIComponent(rawId);
  const isNew = id === 'new';
  if (isNew && !c.creatable) notFound();

  const shape = await shapeFor(c, isNew ? null : id);
  let initial: unknown;
  if (isNew) {
    const from = typeof sp.from === 'string' ? await getEntry(c, sp.from) : null;
    initial = from ? { ...(from as Record<string, unknown>), [c.pk]: '' } : blank(shape.sample);
    if (initial && typeof initial === 'object' && 'published' in (initial as object)) (initial as Record<string, unknown>).published = false;
  } else {
    initial = await getEntry(c, id);
    if (initial === null) notFound();
  }

  const title = isNew ? `New — ${c.label}` : c.kind === 'pages' ? pageInfo(id).label : c.kind === 'site' ? c.label : titleOf(initial, id);
  const path = isNew ? null : c.kind === 'pages' ? pageInfo(id).path : (c.path?.(id) ?? null);
  const back = c.kind === 'site' ? '/admin/cms' : `/admin/cms/${c.key}`;

  return (
    <AdminShell
      section="content"
      viewer={viewer}
      title={title}
      actions={<Link href={back} className="link-arrow"><ArrowLeft size={15} aria-hidden /> {c.kind === 'site' ? 'All content' : c.label}</Link>}
    >
      {sp.saved === '1' && <p className="notice-ok" role="status">Created and published.</p>}
      {isNew && <p className="muted admin-lead">New entries start hidden — tick “Published” when ready.</p>}
      <EntryEditor
        collectionKey={c.key}
        id={isNew ? null : id}
        pk={c.pk}
        initial={initial}
        sample={shape.sample}
        nullable={shape.nullable}
        suggestions={shape.suggestions}
        viewHref={path ? `/en${path === '/' ? '' : path}` : null}
      />
      {!isNew && c.creatable && (
        <form action={deleteEntryAction} className="cms-delete">
          <input type="hidden" name="collection" value={c.key} />
          <input type="hidden" name="id" value={id} />
          <ConfirmSubmit message={`Delete "${title}" permanently?`} className="btn btn-outline btn-sm is-danger"><Trash2 size={14} aria-hidden /> Delete this entry</ConfirmSubmit>
          <small className="muted">To hide something temporarily, untick “Published” instead.</small>
        </form>
      )}
    </AdminShell>
  );
}

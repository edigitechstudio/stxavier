import { getViewer } from '@/lib/auth/viewer';
import { getPageContent } from '@/lib/content';
import { checkUpload } from '@/lib/portal/files';
import { addMyDocument } from '@/lib/portal/student';
import { rateLimit } from '@/lib/ratelimit';

/** Student document upload (multipart): application_id, doc_type, file. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await rateLimit('doc-upload', viewer.id, 20, 600))) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const content = await getPageContent('portal');
  const maxBytes = content.max_upload_mb * 1024 * 1024;
  // Refuse obviously oversized bodies before buffering them.
  if (Number(req.headers.get('content-length') ?? 0) > maxBytes + 64 * 1024) return Response.json({ error: 'too_large' }, { status: 413 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const applicationId = String(form?.get('application_id') ?? '');
  const docType = String(form?.get('doc_type') ?? '');
  if (!(file instanceof File)) return Response.json({ error: 'choose' }, { status: 400 });
  if (!content.document_types.some((t) => t.key === docType)) return Response.json({ error: 'generic' }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkUpload(bytes, file.type, file.name, maxBytes);
  if (!check.ok) return Response.json({ error: check.reason }, { status: 422 });

  try {
    const doc = await addMyDocument(viewer, { applicationId, docType, fileName: check.name, mime: check.mime, ext: check.ext, bytes });
    if (!doc) return Response.json({ error: 'not_found' }, { status: 404 });
    return Response.json({ ok: true, id: doc.id });
  } catch (e) {
    console.error('[documents] upload failed', e);
    return Response.json({ error: 'generic' }, { status: 500 });
  }
}

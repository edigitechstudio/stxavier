import { getViewer } from '@/lib/auth/viewer';
import { listImages, MAX_IMAGE_BYTES, uploadImage } from '@/lib/cms/media';
import { rateLimit } from '@/lib/ratelimit';

/** Media library for the content editor (admins only). GET lists images, POST uploads one. */
async function admin() {
  const v = await getViewer();
  return v?.role === 'admin' ? v : null;
}

export async function GET() {
  if (!(await admin())) return Response.json({ error: 'forbidden' }, { status: 403 });
  return Response.json({ items: await listImages() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const v = await admin();
  if (!v) return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!(await rateLimit('media-upload', v.id, 60, 600))) return Response.json({ error: 'Too many uploads — wait a few minutes.' }, { status: 429 });
  if (Number(req.headers.get('content-length') ?? 0) > MAX_IMAGE_BYTES + 64 * 1024) return Response.json({ error: 'Images must be 5 MB or smaller.' }, { status: 413 });
  const file = (await req.formData().catch(() => null))?.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Choose an image.' }, { status: 400 });
  const res = await uploadImage(new Uint8Array(await file.arrayBuffer()));
  return res.ok ? Response.json({ url: res.url }) : Response.json({ error: res.error }, { status: 422 });
}

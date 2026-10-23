import { getViewer } from '@/lib/auth/viewer';
import { documentDownload } from '@/lib/portal/student';

/**
 * Download a document: the owner or staff only. Always served as an attachment with nosniff,
 * so an uploaded file can never render as a page on our origin.
 */
export async function GET(_req: Request, ctx: RouteContext<'/api/portal/documents/[id]'>) {
  const viewer = await getViewer();
  if (!viewer) return new Response('Unauthorized', { status: 401 });
  const { id } = await ctx.params;
  const file = await documentDownload(viewer, id);
  if (!file) return new Response('Not found', { status: 404 });

  if (file.url) return Response.redirect(file.url, 303); // 60-second signed Storage URL
  const ascii = file.name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  return new Response(new Blob([file.bytes as BlobPart], { type: file.mime }), {
    headers: {
      'Content-Type': file.mime,
      'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}

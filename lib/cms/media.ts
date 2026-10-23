import 'server-only';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isSupabaseConfigured } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Media library for the dashboard: public images (heroes, photos, logos, covers).
 * Supabase Storage bucket "media" in production; public/uploads in local development.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export type MediaItem = { url: string; name: string; size: number; created: string };

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' } as const;
type ImageMime = keyof typeof TYPES;

/** Real image type from the file's first bytes (raster formats only — SVG can carry scripts). */
export function sniffImage(b: Uint8Array): ImageMime | null {
  const at = (sig: number[], off = 0) => sig.every((v, i) => b[off + i] === v);
  if (at([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  if (at([0x66, 0x74, 0x79, 0x70], 4) && /^(avif|avis)$/.test(String.fromCharCode(...b.slice(8, 12)))) return 'image/avif';
  return null;
}

const LOCAL_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function uploadImage(bytes: Uint8Array): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!bytes.byteLength) return { ok: false, error: 'The file is empty.' };
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { ok: false, error: 'Images must be 5 MB or smaller.' };
  const mime = sniffImage(bytes);
  if (!mime) return { ok: false, error: 'Only JPG, PNG, WebP or AVIF images are accepted.' };
  const name = `${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.${TYPES[mime]}`;

  if (!isSupabaseConfigured) {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, name), bytes);
    return { ok: true, url: `/uploads/${name}` };
  }
  const storage = createServiceClient().storage.from('media');
  const { error } = await storage.upload(`uploads/${name}`, bytes, { contentType: mime, cacheControl: '31536000', upsert: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, url: storage.getPublicUrl(`uploads/${name}`).data.publicUrl };
}

export async function listImages(): Promise<MediaItem[]> {
  if (!isSupabaseConfigured) {
    let files: string[] = [];
    try {
      files = await readdir(LOCAL_DIR);
    } catch {
      return [];
    }
    const items = await Promise.all(
      files.filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).map(async (f) => {
        const s = await stat(path.join(LOCAL_DIR, f));
        return { url: `/uploads/${f}`, name: f, size: s.size, created: s.mtime.toISOString() };
      }),
    );
    return items.sort((a, b) => b.created.localeCompare(a.created));
  }
  const storage = createServiceClient().storage.from('media');
  const { data, error } = await storage.list('uploads', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((f) => f.name && !f.name.startsWith('.'))
    .map((f) => ({ url: storage.getPublicUrl(`uploads/${f.name}`).data.publicUrl, name: f.name, size: (f.metadata?.size as number) ?? 0, created: f.created_at ?? '' }));
}

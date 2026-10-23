import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { MediaManager } from '@/components/admin/cms/media-manager';
import { requireAdmin } from '@/lib/auth/viewer';
import { listImages } from '@/lib/cms/media';

export const metadata: Metadata = { title: 'Media library' };

export default function MediaPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Media />
    </Suspense>
  );
}

async function Media() {
  const viewer = await requireAdmin();
  const items = await listImages();
  return (
    <AdminShell section="content" viewer={viewer} title="Media library" actions={<Link href="/admin/cms" className="link-arrow"><ArrowLeft size={15} aria-hidden /> All content</Link>}>
      <p className="muted admin-lead">Upload photos once and use them anywhere: every image field in the editor has a “Library” button. Use landscape photos at least 1600 px wide for page banners.</p>
      <MediaManager initial={items} />
    </AdminShell>
  );
}

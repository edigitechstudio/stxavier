import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Images, Languages, RefreshCw } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { requireAdmin } from '@/lib/auth/viewer';
import { COLLECTIONS } from '@/lib/cms/collections';
import { listEntries } from '@/lib/cms/store';
import { isSupabaseConfigured } from '@/lib/env';
import { refreshContent } from '../actions';

export const metadata: Metadata = { title: 'Website content' };

export default function CmsHome() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const viewer = await requireAdmin();
  const counts = await Promise.all(COLLECTIONS.map(async (c) => [c.key, (await listEntries(c)).length] as const));
  const count = Object.fromEntries(counts);
  const groups = [...new Set(COLLECTIONS.map((c) => c.group))];

  return (
    <AdminShell
      section="content"
      viewer={viewer}
      title="Website content"
      actions={
        // For edits made directly in the Supabase table editor (dashboard edits publish on save).
        <form action={refreshContent}>
          <input type="hidden" name="table" value="all" />
          <button type="submit" className="btn btn-outline btn-sm" title="Use after editing data directly in Supabase"><RefreshCw size={15} aria-hidden /> Refresh live site</button>
        </form>
      }
    >
      <p className="muted admin-lead">
        Everything on the website is edited here: text in English and Nepali, images, lists, prices, dates and menus. Saving publishes the change immediately.
        {!isSupabaseConfigured && ' Local demo mode: edits apply to this running site until the server restarts.'}
      </p>

      <div className="content-grid">
        <Link href="/admin/cms/ui" className="admin-card cms-card is-accent">
          <h2><Languages size={18} aria-hidden /> Interface text</h2>
          <p className="muted">Every heading, label, button, message and SEO title on the site, in both languages.</p>
          <span className="link-arrow">Edit text <ArrowRight size={14} aria-hidden /></span>
        </Link>
        <Link href="/admin/cms/media" className="admin-card cms-card is-accent">
          <h2><Images size={18} aria-hidden /> Media library</h2>
          <p className="muted">Upload photos, logos and banners once, then pick them in any editor.</p>
          <span className="link-arrow">Open library <ArrowRight size={14} aria-hidden /></span>
        </Link>
      </div>

      {groups.map((g) => (
        <section key={g} className="cms-section">
          <h2 className="admin-sub">{g}</h2>
          <div className="content-grid">
            {COLLECTIONS.filter((c) => c.group === g).map((c) => (
              <Link key={c.key} href={c.kind === 'site' ? '/admin/cms/site/main' : `/admin/cms/${c.key}`} className="admin-card cms-card">
                <h2>{c.label} {c.kind !== 'site' && <small className="muted tabular">{count[c.key]}</small>}</h2>
                <p className="muted">{c.description}</p>
                <span className="link-arrow">Edit <ArrowRight size={14} aria-hidden /></span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </AdminShell>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdminShell, AdminSkeleton } from '@/components/admin/admin-shell';
import { UiTextForm, type UiRow } from '@/components/admin/cms/ui-text-form';
import { requireAdmin } from '@/lib/auth/viewer';
import { flatten, overridesFor } from '@/lib/cms/ui-text';
import { defaultMessages } from '@/lib/i18n/messages';

export const metadata: Metadata = { title: 'Interface text' };

/** Friendly names for message groups. */
const GROUPS: Record<string, string> = {
  common: 'General', header: 'Header & menu', footer: 'Footer', cta: 'Call-to-action buttons', theme: 'Theme switcher', whatsapp: 'WhatsApp messages',
  newsletter: 'Newsletter', cookie: 'Cookie banner', notFound: 'Page not found', error: 'Error page', home: 'Home page', counselling: 'Counselling form',
  pages: 'Inner pages', meta: 'SEO titles & descriptions', tools: 'Tools', trust: 'Stories, universities, blog, events, FAQ, search', booking: 'Booking',
  enquiry: 'Enquiry form', exit: 'Exit-intent offer', guide: 'Printable guides', portal: 'Student portal', chat: 'AI assistant',
};

export default function UiTextPage({ searchParams }: PageProps<'/admin/cms/ui'>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <UiText searchParams={searchParams} />
    </Suspense>
  );
}

async function UiText({ searchParams }: { searchParams: PageProps<'/admin/cms/ui'>['searchParams'] }) {
  const viewer = await requireAdmin();
  const sp = await searchParams;
  const [enDef, neDef, enOv, neOv] = await Promise.all([defaultMessages('en').then(flatten), defaultMessages('ne').then(flatten), overridesFor('en'), overridesFor('ne')]);
  const namespaces = Object.keys(await defaultMessages('en'));
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase() : '';
  const ns = q ? '*' : typeof sp.ns === 'string' && namespaces.includes(sp.ns) ? sp.ns : namespaces[0];

  const keys = Object.keys(enDef).filter((k) =>
    q ? [k, enDef[k], neDef[k] ?? '', enOv[k] ?? '', neOv[k] ?? ''].some((s) => s.toLowerCase().includes(q)) : k.startsWith(`${ns}.`),
  );
  const rows: UiRow[] = keys.slice(0, 300).map((k) => ({
    key: k,
    en: enOv[k] ?? enDef[k],
    ne: neOv[k] ?? neDef[k] ?? '',
    enDefault: enDef[k],
    neDefault: neDef[k] ?? '',
  }));
  const changedIn = (n: string) => [...Object.keys(enOv), ...Object.keys(neOv)].filter((k) => k.startsWith(`${n}.`)).length;

  return (
    <AdminShell section="content" viewer={viewer} title="Interface text" actions={<Link href="/admin/cms" className="link-arrow"><ArrowLeft size={15} aria-hidden /> All content</Link>}>
      <p className="muted admin-lead">Every fixed piece of text on the site — headings, labels, buttons, messages, SEO titles. Change the wording in either language; clear a field (or press ↺) to go back to the default.</p>
      <form className="admin-filters" method="get" role="search">
        <label className="grow">Search all text<input type="search" name="q" defaultValue={q} placeholder="e.g. Book a free session" /></label>
        <button type="submit" className="btn btn-outline btn-sm">Search</button>
        {q && <Link href="/admin/cms/ui" className="link-arrow">Clear</Link>}
      </form>
      <div className="ui-layout">
        <nav className="ui-groups" aria-label="Text groups">
          {namespaces.map((n) => (
            <Link key={n} href={`/admin/cms/ui?ns=${n}`} className={!q && n === ns ? 'is-active' : ''} aria-current={!q && n === ns ? 'page' : undefined}>
              {GROUPS[n] ?? n}
              {changedIn(n) > 0 && <span className="badge is-new">{changedIn(n)}</span>}
            </Link>
          ))}
        </nav>
        <section className="admin-card">
          <h2>{q ? `${keys.length} match${keys.length === 1 ? '' : 'es'} for “${q}”` : GROUPS[ns] ?? ns}</h2>
          <div className="ui-head" aria-hidden><span>Key</span><span>English</span><span>नेपाली</span></div>
          {rows.length ? <UiTextForm key={`${ns}|${q}`} ns={ns} rows={rows} /> : <p className="muted">No text matches.</p>}
        </section>
      </div>
    </AdminShell>
  );
}

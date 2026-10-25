import type { ReactNode } from 'react';
import { Bell, FileText, LayoutDashboard, LogOut, Plane } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { signOut } from '@/lib/auth/actions';
import type { Viewer } from '@/types/portal';

export type PortalTab = 'dashboard' | 'documents' | 'notifications' | 'preDeparture';

const TABS = [
  { id: 'dashboard', href: '/portal', icon: LayoutDashboard },
  { id: 'documents', href: '/portal/documents', icon: FileText },
  { id: 'notifications', href: '/portal/notifications', icon: Bell },
  { id: 'preDeparture', href: '/portal/pre-departure', icon: Plane },
] as const;

/** Student portal frame: tab navigation, who's signed in, sign-out. */
export async function PortalShell({ active, viewer, unread, locale, children }: { active: PortalTab; viewer: Viewer; unread: number; locale: string; children: ReactNode }) {
  const t = await getTranslations('portal.nav');
  return (
    <div className="wrap portal">
      <aside className="portal-side">
        <div className="portal-user" title={`${viewer.name} · ${viewer.email}`}>
          <span className="portal-avatar" aria-hidden>{viewer.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{viewer.name}</strong>
            <small>{viewer.email}</small>
          </span>
        </div>
        <nav aria-label={t('menu')} className="portal-nav">
          {TABS.map(({ id, href, icon: Icon }) => (
            <Link key={id} href={href} className={id === active ? 'is-active' : ''} aria-current={id === active ? 'page' : undefined}>
              <Icon size={18} aria-hidden /> {t(id)}
              {id === 'notifications' && unread > 0 && <span className="portal-count" aria-label={`${unread}`}>{unread}</span>}
            </Link>
          ))}
        </nav>
        <form action={signOut}>
          <input type="hidden" name="next" value={`/${locale}/portal/login`} />
          <button type="submit" className="portal-signout">
            <LogOut size={16} aria-hidden /> {t('signOut')}
          </button>
        </form>
      </aside>
      <div className="portal-main">{children}</div>
    </div>
  );
}

export function PortalSkeleton() {
  return (
    <div className="wrap portal" aria-busy="true">
      <div className="portal-side portal-skel" />
      <div className="portal-main">
        <div className="portal-skel" style={{ height: 160 }} />
        <div className="portal-skel" style={{ height: 320 }} />
      </div>
    </div>
  );
}

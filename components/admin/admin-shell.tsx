import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarClock, CalendarDays, ExternalLink, FolderKanban, Inbox, KeyRound, LayoutDashboard, LogOut, Newspaper, Users } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';
import { demoAuth } from '@/lib/auth/mode';
import type { Viewer } from '@/types/portal';

export type AdminSection = 'overview' | 'leads' | 'bookings' | 'availability' | 'applications' | 'users' | 'content' | 'account';

const NAV = [
  { id: 'overview', href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', href: '/admin/leads', label: 'Leads', icon: Inbox },
  { id: 'bookings', href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'availability', href: '/admin/availability', label: 'Availability', icon: CalendarClock },
  { id: 'applications', href: '/admin/applications', label: 'Applications', icon: FolderKanban },
  { id: 'users', href: '/admin/users', label: 'Users & roles', icon: Users, adminOnly: true },
  { id: 'content', href: '/admin/cms', label: 'Website content', icon: Newspaper, adminOnly: true },
] as const;

export function AdminShell({ section, viewer, title, actions, children }: { section: AdminSection; viewer: Viewer; title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="admin">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand">
          <Image src="/brand/logo-mark.webp" alt="" width={44} height={24} />
          <span>
            <strong>St. Xavier</strong>
            <small>Admin</small>
          </span>
        </Link>
        <nav aria-label="Admin" className="admin-nav">
          {NAV.filter((n) => !('adminOnly' in n) || viewer.role === 'admin').map(({ id, href, label, icon: Icon }) => (
            <Link key={id} href={href} className={id === section ? 'is-active' : ''} aria-current={id === section ? 'page' : undefined}>
              <Icon size={18} aria-hidden /> {label}
            </Link>
          ))}
        </nav>
        <div className="admin-me">
          {demoAuth && <span className="admin-demo">Demo mode</span>}
          <strong>{viewer.name}</strong>
          <small>{viewer.role}</small>
          <Link href="/admin/account" className="admin-site" aria-current={section === 'account' ? 'page' : undefined}>
            <KeyRound size={13} aria-hidden /> My account
          </Link>
          <a href="/en" className="admin-site" target="_blank" rel="noopener">View website <ExternalLink size={13} aria-hidden /></a>
          <form action={signOut}>
            <input type="hidden" name="next" value="/admin/login" />
            <button type="submit" className="portal-signout"><LogOut size={16} aria-hidden /> Sign out</button>
          </form>
        </div>
      </aside>
      <main className="admin-main" id="main">
        <header className="admin-head">
          <h1>{title}</h1>
          {actions && <div className="admin-head-actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="admin" aria-busy="true">
      <aside className="admin-side" />
      <main className="admin-main">
        <div className="portal-skel" style={{ height: 48, width: 280 }} />
        <div className="portal-skel" style={{ height: 380, marginTop: 24 }} />
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AlertTriangle, ArrowRight, Bell, CalendarClock, FileText, MessageSquare, Milestone } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { PortalShell, PortalSkeleton } from '@/components/portal/portal-shell';
import { Link } from '@/i18n/navigation';
import { currentLocale } from '@/lib/i18n/locale';
import { loadPortal, needsStudent } from '@/lib/portal/view';
import { markAllRead } from '../actions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('portalNotifications') };
}

export default async function NotificationsPage() {
  const locale = await currentLocale();
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <Notifications locale={locale} />
    </Suspense>
  );
}

const KIND_ICON = { deadline: CalendarClock, document: FileText, stage: Milestone, message: MessageSquare } as const;

/** Only same-site portal links stored on a notification are rendered as links. */
const portalHref = (link: string | null) => (link && /^\/portal(?:\/[\w-]*)*(?:\?[\w=&-]*)?$/.test(link) ? link : null);

async function Notifications({ locale }: { locale: string }) {
  const [p, t, format] = await Promise.all([loadPortal(locale, '/portal/notifications'), getTranslations('portal.notif'), getFormatter()]);
  const missing = needsStudent([...p.slots.values()].flat());
  const { now } = p;

  return (
    <PortalShell active="notifications" viewer={p.viewer} unread={p.unread} locale={locale}>
      <header className="portal-head portal-head-row">
        <div>
          <h1>{t('title')}</h1>
        </div>
        {p.unread > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="btn btn-outline btn-sm">{t('markAll')}</button>
          </form>
        )}
      </header>

      {missing.length > 0 && (
        <Link href="/portal/documents" className="notice is-warning">
          <AlertTriangle size={22} aria-hidden />
          <span>
            <strong>{t('missing')}</strong>
            <small>{t('missingBody', { docs: missing.map((m) => m.label).join(', ') })}</small>
          </span>
          <ArrowRight size={18} aria-hidden />
        </Link>
      )}

      {p.notifications.length === 0 ? (
        <section className="portal-card portal-empty">
          <Bell size={32} aria-hidden />
          <p className="muted">{t('empty')}</p>
        </section>
      ) : (
        <ul className="notice-list">
          {p.notifications.map((n) => {
            const Icon = KIND_ICON[n.kind];
            const href = portalHref(n.link);
            const overdue = n.due_at && Date.parse(n.due_at) < now;
            return (
              <li key={n.id} className={`notice ${n.read_at ? '' : 'is-unread'} ${n.kind === 'deadline' ? 'is-deadline' : ''}`}>
                <Icon size={22} aria-hidden />
                <span>
                  <small className="notice-kind">
                    {t(`kinds.${n.kind}`)}
                    {!n.read_at && <em>{t('new')}</em>}
                  </small>
                  <strong>{n.title}</strong>
                  {n.body && <small>{n.body}</small>}
                  {n.due_at && (
                    <small className={overdue ? 'notice-overdue' : 'notice-due'}>
                      {(overdue ? t('overdue', { date: format.dateTime(new Date(n.due_at), { dateStyle: 'medium' }) }) : t('due', { date: format.dateTime(new Date(n.due_at), { dateStyle: 'medium' }) }))}
                    </small>
                  )}
                </span>
                <span className="notice-side">
                  <time dateTime={n.created_at}>{format.relativeTime(new Date(n.created_at), now)}</time>
                  {href && <Link href={href} className="link-arrow">{t('open')} <ArrowRight size={14} aria-hidden /></Link>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </PortalShell>
  );
}

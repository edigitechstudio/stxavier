import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AlertCircle, ArrowRight, Bell, CalendarCheck, FileText, PartyPopper } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Flag } from '@/components/brand/flag';
import { PortalShell, PortalSkeleton } from '@/components/portal/portal-shell';
import { StageTracker } from '@/components/portal/stage-tracker';
import { Link } from '@/i18n/navigation';
import { currentLocale } from '@/lib/i18n/locale';
import { getMyStageHistory } from '@/lib/portal/student';
import { isPreDepartureUnlocked, loadPortal, needsStudent } from '@/lib/portal/view';
import { APP_STAGES, stageIndex, type AppStage } from '@/types/portal';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('portal') };
}

export default async function PortalPage() {
  const locale = await currentLocale();
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <Dashboard locale={locale} />
    </Suspense>
  );
}

async function Dashboard({ locale }: { locale: string }) {
  const p = await loadPortal(locale, '/portal');
  const [t, ts, td, format] = await Promise.all([getTranslations('portal.dashboard'), getTranslations('portal.stages'), getTranslations('portal.stageDesc'), getFormatter()]);
  const labels = Object.fromEntries(APP_STAGES.map((s) => [s, ts(s)])) as Record<AppStage, string>;
  const descs = Object.fromEntries(APP_STAGES.map((s) => [s, td(s)])) as Record<AppStage, string>;
  const histories = await getMyStageHistory(p.viewer, p.apps.map((a) => a.id));
  const allSlots = [...p.slots.values()].flat();
  const required = allSlots.filter((s) => s.required);
  const verified = required.filter((s) => s.latest?.status === 'verified').length;
  const attention = needsStudent(allSlots).length;
  const unreadList = p.notifications.filter((n) => !n.read_at).slice(0, 3);

  return (
    <PortalShell active="dashboard" viewer={p.viewer} unread={p.unread} locale={locale}>
      <header className="portal-head">
        <h1>{t('welcome', { name: p.viewer.name.split(' ')[0] })}</h1>
        <p className="muted">{t('intro')}</p>
      </header>

      {isPreDepartureUnlocked(p.apps) && (
        <Link href="/portal/pre-departure" className="portal-banner">
          <PartyPopper size={22} aria-hidden /> <strong>{t('preUnlocked')}</strong> <span>{t('preOpen')} <ArrowRight size={15} aria-hidden /></span>
        </Link>
      )}

      {p.apps.length === 0 ? (
        <section className="portal-card portal-empty">
          <h2>{t('noApplication')}</h2>
          <p className="muted">{t('noApplicationBody')}</p>
          <Link href="/book" className="btn btn-primary"><CalendarCheck size={18} aria-hidden /> {t('book')}</Link>
        </section>
      ) : (
        p.apps.map((a) => {
          const history = histories.filter((h) => h.application_id === a.id).slice(0, 4);
          return (
            <section key={a.id} className="portal-card" aria-labelledby={`app-${a.id}`}>
              <div className="portal-app-head">
                <Flag code={p.flagOf(a.country)} className="portal-flag" />
                <div>
                  <h2 id={`app-${a.id}`}>{a.university ?? p.countryName(a.country)}</h2>
                  <p className="muted">{[a.course, p.countryName(a.country)].filter(Boolean).join(' · ')}</p>
                </div>
                <span className="portal-stage-pill">{t('stageOf', { n: stageIndex(a.stage) + 1, total: APP_STAGES.length })}</span>
              </div>
              <h3 className="sr-only">{t('tracker')}</h3>
              <StageTracker stage={a.stage} labels={labels} descriptions={descs} />
              <dl className="portal-facts">
                {a.intake && <div><dt>{t('intake')}</dt><dd>{a.intake}</dd></div>}
                {a.counsellor && <div><dt>{t('counsellor')}</dt><dd>{p.counsellorName(a.counsellor)}</dd></div>}
              </dl>
              {history.length > 0 && (
                <>
                  <h3 className="portal-sub">{t('history')}</h3>
                  <ul className="portal-history">
                    {history.map((h) => (
                      <li key={h.id}>
                        <time dateTime={h.created_at}>{format.dateTime(new Date(h.created_at), { dateStyle: 'medium' })}</time>
                        <span><strong>{labels[h.to_stage]}</strong>{h.note && <> — {h.note}</>}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          );
        })
      )}

      {p.apps.length > 0 && (
        <div className="portal-grid">
          <section className="portal-card">
            <h2 className="portal-card-title"><FileText size={20} aria-hidden /> {t('documents')}</h2>
            <div className="portal-meter" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={verified} aria-label={t('docsProgress', { done: verified, total: required.length })}>
              <span style={{ width: `${required.length ? (verified / required.length) * 100 : 0}%` }} />
            </div>
            <p>{t('docsProgress', { done: verified, total: required.length })}</p>
            {attention > 0 && <p className="portal-attention"><AlertCircle size={16} aria-hidden /> {t('needsAction', { n: attention })}</p>}
            <Link href="/portal/documents" className="btn btn-primary btn-sm">{t('upload')}</Link>
          </section>
          <section className="portal-card">
            <h2 className="portal-card-title"><Bell size={20} aria-hidden /> {t('notifications')} {p.unread > 0 && <span className="portal-count">{p.unread}</span>}</h2>
            {unreadList.length === 0 ? (
              <p className="muted">{t('nothingNew')}</p>
            ) : (
              <ul className="portal-notes">
                {unreadList.map((n) => (
                  <li key={n.id}>
                    <strong>{n.title}</strong>
                    {n.due_at && <small>{format.dateTime(new Date(n.due_at), { dateStyle: 'medium' })}</small>}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/portal/notifications" className="link-arrow">{t('viewAll')} <ArrowRight size={15} aria-hidden /></Link>
          </section>
        </div>
      )}
    </PortalShell>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckSquare, Home, Lock, Luggage, Plane, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PortalShell, PortalSkeleton } from '@/components/portal/portal-shell';
import { Link } from '@/i18n/navigation';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { isPreDepartureUnlocked, loadPortal } from '@/lib/portal/view';
import { stageIndex } from '@/types/portal';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('portalPre') };
}

export default async function PreDeparturePage() {
  const locale = await currentLocale();
  return (
    <Suspense fallback={<PortalSkeleton />}>
      <PreDeparture locale={locale} />
    </Suspense>
  );
}

const ICONS = { luggage: Luggage, plane: Plane, home: Home, users: Users } as const;

async function PreDeparture({ locale }: { locale: string }) {
  const [p, t] = await Promise.all([loadPortal(locale, '/portal/pre-departure'), getTranslations('portal.pre')]);
  const unlocked = isPreDepartureUnlocked(p.apps);
  const app = p.apps.filter((a) => stageIndex(a.stage) >= stageIndex('visa_granted'))[0];
  const sections = unlocked ? p.content.pre_departure.filter((s) => s.countries.length === 0 || s.countries.includes(app.country)) : [];

  return (
    <PortalShell active="preDeparture" viewer={p.viewer} unread={p.unread} locale={locale}>
      <header className="portal-head">
        <h1>{t('title')}</h1>
        {unlocked && <p className="muted">{t('intro', { country: p.countryName(app.country) })}</p>}
      </header>

      {!unlocked ? (
        <section className="portal-card portal-empty portal-locked">
          <span className="portal-lock"><Lock size={30} aria-hidden /></span>
          <h2>{t('locked')}</h2>
          <p className="muted">{t('lockedBody')}</p>
          <Link href="/portal" className="btn btn-outline">{t('back')}</Link>
        </section>
      ) : (
        <div className="pre-grid">
          {sections.map((s) => {
            const Icon = ICONS[s.icon as keyof typeof ICONS] ?? CheckSquare;
            return (
              <section key={s.id} className="portal-card pre-card">
                <h2 className="portal-card-title"><span className="pre-icon"><Icon size={20} aria-hidden /></span> {l(s.title, locale)}</h2>
                <ul className="pre-list">
                  {s.items.map((item) => (
                    <li key={item.en}>{l(item, locale)}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}

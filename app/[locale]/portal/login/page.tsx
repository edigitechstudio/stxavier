import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LoginPanel, type LoginLabels } from '@/components/auth/login-panel';
import { demoAuth } from '@/lib/auth/mode';
import { getAuthProviders } from '@/lib/auth/providers';
import { safeNext } from '@/lib/auth/safe-next';
import { getViewer } from '@/lib/auth/viewer';
import { isSupabaseConfigured } from '@/lib/env';
import { currentLocale } from '@/lib/i18n/locale';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('portalLogin'), robots: { index: false, follow: false } };
}

export default async function PortalLoginPage({ searchParams }: PageProps<'/[locale]/portal/login'>) {
  const locale = await currentLocale();
  const t = await getTranslations('portal.login');
  return (
    <div className="wrap auth-wrap">
      <section className="auth-card">
        <span className="auth-icon"><GraduationCap size={28} aria-hidden /></span>
        <h1>{t('title')}</h1>
        <p className="muted">{t('subtitle')}</p>
        <Suspense fallback={<div className="auth-skel" aria-hidden />}>
          <LoginBody locale={locale} searchParams={searchParams} />
        </Suspense>
        <p className="auth-help">{t('help')}</p>
      </section>
    </div>
  );
}

async function LoginBody({ locale, searchParams }: { locale: string; searchParams: PageProps<'/[locale]/portal/login'>['searchParams'] }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === 'string' ? sp.next : null, `/${locale}/portal`);
  if (await getViewer()) redirect(next);
  const t = await getTranslations('portal.login');
  const error = typeof sp.error === 'string' && ['link_expired', 'link_invalid', 'not_configured'].includes(sp.error) ? t(`errors.${sp.error as 'link_expired'}`) : null;
  const keys = ['email', 'emailPlaceholder', 'sendLink', 'sending', 'google', 'or', 'sentTitle', 'sentBody', 'code', 'verify', 'useDifferent', 'invalidEmail', 'invalidCode', 'error', 'verifying', 'demoTitle', 'demoBody', 'demoStudent', 'demoCounsellor', 'demoAdmin'] as const;
  const labels = { ...Object.fromEntries(keys.map((k) => [k, k === 'sentBody' ? t.raw(k) : t(k)])), unavailable: t('errors.not_configured') } as LoginLabels;
  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      <LoginPanel next={next} labels={labels} demo={demoAuth} configured={isSupabaseConfigured} allowSignup demoRoles={['student']} google={(await getAuthProviders()).google} />
    </>
  );
}

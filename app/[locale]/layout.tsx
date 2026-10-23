import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { currentLocale } from '@/lib/i18n/locale';
import { Analytics } from '@/components/consent/analytics';
import { ExitIntent } from '@/components/booking/exit-intent';
import { ChatLauncher } from '@/components/chat/chat-launcher';
import { CookieBanner } from '@/components/consent/cookie-banner';
import { FloatingCta } from '@/components/layout/floating-cta';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ContactProvider } from '@/components/providers/contact-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { CounsellingProvider } from '@/components/sx/counselling';
import { JsonLd } from '@/components/seo/json-ld';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';
import { jakarta, mukta, serif } from '@/lib/fonts';
import { getDestinations, getHomeContent, getNavigation, getOffices, getPageContent, getSiteSettings, getTestPrepCourses } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { languageAlternates } from '@/lib/seo/urls';
import { getGoogleReviews } from '@/lib/reviews';
import '../globals.css';


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const site = await getSiteSettings();
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: site.name, template: '%s | St. Xavier' },
    description: l(site.description, locale),
    applicationName: site.name,
    alternates: { languages: languageAlternates('/') },
    openGraph: { siteName: site.name, type: 'website' },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#071029' },
  ],
};

export default async function LocaleLayout({ children }: LayoutProps<'/[locale]'>) {
  const locale = await currentLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  const [t, tw, tc, tCookie, site, offices, destinations, courses, tools, home, reviews, chat] = await Promise.all([
    getTranslations('common'),
    getTranslations('whatsapp'),
    getTranslations('cta'),
    getTranslations('cookie'),
    getSiteSettings(),
    getOffices(),
    getDestinations(),
    getTestPrepCourses(),
    getNavigation('header').then((nav) => nav.find((n) => n.id === 'tools')?.children ?? []),
    getHomeContent(),
    getGoogleReviews(locale),
    getPageContent('chat'),
  ]);

  const nameMap = <T,>(rows: T[], key: (r: T) => string, label: (r: T) => string) =>
    Object.fromEntries(rows.map((r) => [key(r), label(r)]));

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${jakarta.variable} ${serif.variable} ${mukta.variable}`}
    >
      <body className="sx-root flex min-h-dvh flex-col">
        {/* Without JS, scroll-reveal content must still be visible. */}
        <noscript>
          <style>{'.reveal{opacity:1!important}'}</style>
        </noscript>
        <a
          href="#main"
          className="bg-primary text-primary-foreground sr-only z-[100] rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t('skipToContent')}
        </a>
        <ThemeProvider>
          <NextIntlClientProvider>
            <ContactProvider
              value={{
                phone: site.phone,
                whatsapp: site.whatsapp,
                messages: {
                  default: tw('default'),
                  destination: tw.raw('destination'),
                  testPrep: tw.raw('testPrep'),
                  tool: tw.raw('tool'),
                },
                names: {
                  destinations: nameMap(destinations, (d) => d.slug, (d) => l(d.name, locale) ?? d.slug),
                  testPrep: nameMap(courses, (c) => c.slug, (c) => l(c.name, locale) ?? c.slug),
                  tools: nameMap(tools, (n) => n.href?.split('/').pop() ?? n.id, (n) => l(n.label, locale) ?? n.id),
                },
              }}
            >
              <CounsellingProvider
                options={{
                  destinations: destinations.map((d) => l(d.name, locale) ?? d.slug),
                  intakes: home.search.intakes.map((i) => l(i, locale) ?? i.en),
                }}
              >
                <Header />
                <main id="main" className="flex-1">
                  {children}
                </main>
                <Footer />
                <FloatingCta
                  labels={{ call: tc('call'), whatsapp: tc('whatsapp'), book: tc('book'), whatsappLabel: tc('whatsappLabel'), backToTop: tc('backToTop'), quickContact: tc('quickContact') }}
                  extra={
                    chat.enabled ? (
                      <ChatLauncher
                        assistantName={l(chat.assistant_name, locale) ?? chat.assistant_name.en}
                        greeting={l(chat.greeting, locale) ?? chat.greeting.en}
                        disclaimer={l(chat.disclaimer, locale) ?? chat.disclaimer.en}
                        suggestions={chat.suggestions.map((s) => l(s, locale) ?? s.en)}
                        whatsappHref={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(tw('default'))}`}
                        phone={site.phone}
                      />
                    ) : undefined
                  }
                />
                <CookieBanner
                  labels={{ title: tCookie('title'), body: tCookie('body'), accept: tCookie('accept'), reject: tCookie('reject'), policy: tCookie('policy') }}
                />
                <ExitIntent destinations={destinations.map((d) => ({ value: d.slug, label: l(d.name, locale) ?? d.slug }))} />
              </CounsellingProvider>
            </ContactProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics ids={{ ga4: env.ga4Id, metaPixel: env.metaPixelId, clarity: env.clarityId }} />
        <JsonLd data={[organizationSchema(site, offices, locale, reviews ? { value: reviews.rating, count: reviews.count } : null), websiteSchema(site, locale)]} />
      </body>
    </html>
  );
}

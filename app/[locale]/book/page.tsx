import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BookingWizard, type BookableCounsellor } from '@/components/booking/booking-wizard';
import { PageHero } from '@/components/sx/page-hero';
import { bookableCounsellors } from '@/lib/booking/service';
import { getAvailability, getPageContent } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/book', title: t('book'), description: t('bookDesc') });
}

export default async function BookPage() {
  const locale = await currentLocale();
  const [settings, team, { rules }, tm] = await Promise.all([getPageContent('booking'), bookableCounsellors(), getAvailability(), getTranslations('meta')]);

  const counsellors: BookableCounsellor[] = team.map((c) => ({
    slug: c.slug,
    name: c.name,
    role: l(c.role, locale) ?? '',
    photo: c.photo,
    languages: c.languages,
    modes: [...new Set(rules.filter((r) => r.counsellor === c.slug).flatMap((r) => r.modes))],
    isPlaceholder: c.is_placeholder,
  }));
  const modeNotes = { office: l(settings.office_address, locale) ?? '', zoom: l(settings.zoom_note, locale) ?? '', whatsapp: l(settings.whatsapp_note, locale) ?? '' };
  const crumbs = [{ label: tm('crumbBook'), href: '/book' }];

  return (
    <>
      <PageHero
        crumbs={crumbs}
        eyebrow={l(settings.hero.eyebrow, locale)}
        title={l(settings.hero.title, locale) ?? ''}
        highlight={l(settings.hero.highlight, locale)}
        subtitle={l(settings.hero.subtitle, locale)}
        image={settings.hero.image}
      />
      <div className="wrap page-body">
        {/* The wizard reads ?counsellor= on the client, so the page itself stays static. */}
        <Suspense fallback={<div className="booking booking-skeleton" aria-hidden />}>
          <BookingWizard counsellors={counsellors} modeNotes={modeNotes} officeAddress={modeNotes.office} />
        </Suspense>
      </div>
    </>
  );
}

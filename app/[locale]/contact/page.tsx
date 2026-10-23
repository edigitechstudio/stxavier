import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';
import { MapEmbed } from '@/components/layout/map-embed';
import { WhatsAppIcon } from '@/components/layout/whatsapp-icon';
import { InlineLeadForm } from '@/components/sx/counselling';
import { PageHero } from '@/components/sx/page-hero';
import { getOffices, getPageContent, getSiteSettings } from '@/lib/content';
import { currentLocale } from '@/lib/i18n/locale';
import { l } from '@/lib/i18n/localize';
import { pageMetadata } from '@/lib/seo/metadata';
import type { OpeningHours } from '@/types/content';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([currentLocale(), getTranslations('meta')]);
  return pageMetadata({ locale, path: '/contact', title: t('contact'), description: t('contactDesc') });
}

export default async function ContactPage() {
  const locale = await currentLocale();
  const [page, site, offices, t, tm, tw, tf, tc, format] = await Promise.all([
    getPageContent('contact'),
    getSiteSettings(),
    getOffices(),
    getTranslations('pages'),
    getTranslations('meta'),
    getTranslations('whatsapp'),
    getTranslations('footer'),
    getTranslations('counselling'),
    getFormatter(),
  ]);
  const head = offices.find((o) => o.is_head_office) ?? offices[0];
  const day = (name: string) => format.dateTime(new Date(2024, 0, 7 + WEEKDAYS.indexOf(name)), { weekday: 'long' });
  const hours = (h: OpeningHours) => `${day(h.days[0])} – ${day(h.days[h.days.length - 1])}: ${h.opens}–${h.closes}`;
  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(tw('default'))}`;

  return (
    <>
      <PageHero
        crumbs={[{ label: tm('crumbContact'), href: '/contact' }]}
        eyebrow={l(page.hero.eyebrow, locale)}
        title={l(page.hero.title, locale) ?? ''}
        highlight={l(page.hero.highlight, locale)}
        subtitle={l(page.hero.subtitle, locale)}
        image={page.hero.image}
      />

      <div className="wrap">
        <div className="contact-cards">
          <a href={`tel:${site.phone}`} className="contact-card">
            <Phone size={24} aria-hidden />
            <strong>{t('callUs')}</strong>
            <span>{site.phone}</span>
          </a>
          <a href={wa} target="_blank" rel="noopener" className="contact-card is-wa">
            <WhatsAppIcon className="size-6" />
            <strong>{t('whatsappUs')}</strong>
            <span>+{site.whatsapp}</span>
          </a>
          <a href={`mailto:${site.email}`} className="contact-card">
            <Mail size={24} aria-hidden />
            <strong>{t('emailUs')}</strong>
            <span>{site.email}</span>
          </a>
          <a href={site.maps_url} target="_blank" rel="noopener" className="contact-card">
            <MapPin size={24} aria-hidden />
            <strong>{t('visitUs')}</strong>
            <span>{head ? `${l(head.street, locale)}, ${head.locality}` : 'Kathmandu'}</span>
          </a>
        </div>
      </div>

      <div className="wrap page-body">
        <div className="split">
          <section className="form-card" aria-labelledby="contact-form-title">
            <InlineLeadForm
              source="contact"
              showMessage
              submitLabel={tc('send')}
              header={
                <>
                  <h2 id="contact-form-title" className="text-2xl font-extrabold">{l(page.form_title, locale)}</h2>
                  <p className="muted">{l(page.form_intro, locale)}</p>
                </>
              }
            />
          </section>

          {head && (
            <section aria-labelledby="office-title" className="grid gap-5">
              <h2 id="office-title" className="section-title">{l(head.name, locale)}</h2>
              {/* NAP — must match the Google Business Profile exactly. */}
              <address className="grid gap-3 not-italic">
                <p className="flex gap-3"><MapPin size={18} className="mt-1 shrink-0 text-[var(--link)]" aria-hidden /> {site.name}, {l(head.street, locale)}, {head.locality}, Nepal</p>
                <p className="flex gap-3"><Phone size={18} className="mt-1 shrink-0 text-[var(--link)]" aria-hidden /> <a href={`tel:${head.phone}`}>{head.phone}</a></p>
                <p className="flex gap-3"><Mail size={18} className="mt-1 shrink-0 text-[var(--link)]" aria-hidden /> <a href={`mailto:${head.email ?? site.email}`}>{head.email ?? site.email}</a></p>
                {head.hours.map((h) => (
                  <p key={h.days.join()} className="flex gap-3">
                    <Clock size={18} className="mt-1 shrink-0 text-[var(--link)]" aria-hidden />
                    <span><span className="sr-only">{t('officeHours')}: </span>{hours(h)}</span>
                  </p>
                ))}
              </address>
              {head.maps_embed_url && <MapEmbed src={head.maps_embed_url} title={tf('mapTitle')} loadLabel={tf('loadMap')} />}
              <a href={site.maps_url} target="_blank" rel="noopener" className="btn btn-dark justify-self-start">
                <Navigation size={16} aria-hidden /> {t('getDirections')}
              </a>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

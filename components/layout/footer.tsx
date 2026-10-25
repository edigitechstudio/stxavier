import { Clock, Mail, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import { cacheLife } from 'next/cache';
import { getFormatter, getLocale, getTranslations } from 'next-intl/server';
import { Logo } from '@/components/brand/logo';
import { CookieSettingsButton } from '@/components/consent/cookie-settings-button';
import { Link } from '@/i18n/navigation';
import { getAccreditations, getHeadOffice, getNavigation, getSiteSettings } from '@/lib/content';
import { l } from '@/lib/i18n/localize';
import type { NavItem, OpeningHours } from '@/types/content';
import { MapEmbed } from './map-embed';
import { NewsletterForm } from './newsletter-form';
import { SocialLinks } from './social-icons';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function CopyrightYear() {
  'use cache';
  cacheLife('days');
  return <>{new Date().getFullYear()}</>;
}

function LinkList({ items, locale }: { items: NavItem[]; locale: string }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i.id}>
          <Link href={i.href ?? '/'}>{l(i.label, locale)}</Link>
        </li>
      ))}
    </ul>
  );
}

export async function Footer() {
  const [locale, t, tn, format, site, office, quick, resources, accreditations] = await Promise.all([
    getLocale(),
    getTranslations('footer'),
    getTranslations('newsletter'),
    getFormatter(),
    getSiteSettings(),
    getHeadOffice(),
    getNavigation('footer_quick'),
    getNavigation('footer_resources'),
    getAccreditations(), // placeholders already excluded in production by the reader
  ]);

  const day = (name: string) => format.dateTime(new Date(2024, 0, 7 + WEEKDAYS.indexOf(name)), { weekday: 'short' });
  const hoursLabel = (h: OpeningHours) =>
    `${day(h.days[0])}${h.days.length > 1 ? `–${day(h.days[h.days.length - 1])}` : ''} · ${h.opens}–${h.closes}`;

  return (
    <footer className="footer">
      <div className="wrap footer-news">
        <div>
          <h2>{tn('title')}</h2>
          <p>{tn('subtitle')}</p>
        </div>
        <NewsletterForm labels={{ email: tn('email'), submit: tn('submit'), success: tn('success'), error: tn('error'), invalid: tn('invalid') }} />
      </div>

      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo light name={site.name} />
          <p>{l(site.description, locale)}</p>
          <p lang="ne" className="footer-tagline">{site.tagline.ne}</p>
          <h3 className="mt">{t('followUs')}</h3>
          <SocialLinks links={site.social} />
        </div>

        <div>
          <h3>{t('quickLinks')}</h3>
          <LinkList items={quick} locale={locale} />
        </div>

        <div>
          <h3>{t('resources')}</h3>
          <LinkList items={resources} locale={locale} />
        </div>

        {office && (
          <div>
            <h3>{t('visitUs')}</h3>
            {/* NAP, must match the Google Business Profile exactly. */}
            <address className="contact-list">
              <p>
                <MapPin size={16} aria-hidden />
                <span>
                  <strong className="text-white">{site.name}</strong>
                  <br />
                  {l(office.street, locale)}, {office.locality}, Nepal
                </span>
              </p>
              <p><Phone size={16} aria-hidden /> <a href={`tel:${office.phone}`}>{office.phone}</a></p>
              <p><Mail size={16} aria-hidden /> <a href={`mailto:${office.email ?? site.email}`}>{office.email ?? site.email}</a></p>
              {office.hours.map((h) => (
                <p key={h.days.join()}>
                  <Clock size={16} aria-hidden />
                  <span><span className="sr-only">{t('officeHours')}: </span>{hoursLabel(h)}</span>
                </p>
              ))}
            </address>
            {office.maps_embed_url && <MapEmbed src={office.maps_embed_url} title={t('mapTitle')} loadLabel={t('loadMap')} />}
            <a href={site.maps_url} target="_blank" rel="noopener" className="footer-pill">
              <Navigation size={15} aria-hidden /> {t('getDirections')}
            </a>
          </div>
        )}
      </div>

      {accreditations.length > 0 && (
        <div className="wrap footer-badges">
          <span>{t('accreditations')}</span>
          {accreditations.map((a) => {
            const pill = (
              <span className="badge-pill">
                <ShieldCheck size={14} aria-hidden /> {a.name}
                {a.is_placeholder && <span className="todo-badge">TODO</span>}
              </span>
            );
            return a.verify_url ? (
              <a key={a.id} href={a.verify_url} target="_blank" rel="noopener">{pill}</a>
            ) : (
              <span key={a.id}>{pill}</span>
            );
          })}
        </div>
      )}

      <div className="wrap footer-bottom">
        <span>
          © <CopyrightYear /> {site.legal_name}. {t('rights')}
        </span>
        <CookieSettingsButton label={t('cookieSettings')} />
      </div>
    </footer>
  );
}

import type {
  Article,
  CollegeOrUniversity,
  BreadcrumbList,
  DayOfWeek,
  Course,
  EducationalOrganization,
  Event,
  FAQPage,
  HowTo,
  OpeningHoursSpecification,
  Person,
  Thing,
  WebPage,
  WebSite,
  WithContext,
} from 'schema-dts';
import { env } from '@/lib/env';
import { l } from '@/lib/i18n/localize';
import type { Faq, Locale, Office, SiteSettings } from '@/types/content';

/**
 * Typed JSON-LD builders. Every entity references the organization by a stable @id so search
 * and answer engines resolve one consistent brand entity across all pages.
 */

export const ORG_ID = `${env.siteUrl}/#organization`;
export const WEBSITE_ID = `${env.siteUrl}/#website`;

const ctx = <T extends Thing>(node: T) => ({ '@context': 'https://schema.org', ...(node as object) }) as WithContext<T>;

function openingHours(office: Office): OpeningHoursSpecification[] {
  return office.hours.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.days.map((d) => `https://schema.org/${d}` as DayOfWeek),
    opens: h.opens,
    closes: h.closes,
  }));
}

/** EducationalOrganization + LocalBusiness for the brand entity (rendered once, in the root layout). */
export function organizationSchema(site: SiteSettings, offices: Office[], locale: Locale, rating?: { value: number; count: number } | null) {
  const head = offices.find((o) => o.is_head_office) ?? offices[0];
  const node = {
    '@type': ['EducationalOrganization', 'LocalBusiness'],
    '@id': ORG_ID,
    name: site.name,
    legalName: site.legal_name,
    alternateName: 'St. Xavier',
    slogan: l(site.tagline, locale),
    description: l(site.description, locale),
    url: site.url,
    logo: `${env.siteUrl}/brand/logo-full.png`,
    image: `${env.siteUrl}/brand/logo-full.png`,
    foundingDate: String(site.founded_year),
    email: site.email,
    telephone: site.phone,
    sameAs: site.social.map((s) => s.url),
    hasMap: site.maps_url,
    areaServed: { '@type': 'Country', name: 'Nepal' },
    ...(head && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: l(head.street, 'en'),
        addressLocality: head.locality,
        addressRegion: head.region,
        postalCode: head.postal_code ?? undefined,
        addressCountry: head.country_code,
      },
      ...(head.lat != null && head.lng != null && {
        geo: { '@type': 'GeoCoordinates', latitude: head.lat, longitude: head.lng },
      }),
      openingHoursSpecification: openingHours(head),
    }),
    // Only real Google review data — never a made-up rating.
    ...(rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating.value, reviewCount: rating.count, bestRating: 5 } }),
  };
  return ctx(node as unknown as EducationalOrganization);
}

export function websiteSchema(site: SiteSettings, locale: Locale) {
  return ctx<WebSite>({
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${env.siteUrl}/${locale}`,
    name: site.name,
    inLanguage: locale === 'ne' ? 'ne-NP' : 'en',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${env.siteUrl}/${locale}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    } as never,
  });
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return ctx<BreadcrumbList>({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  });
}

export function faqSchema(faqs: Faq[], locale: Locale) {
  return ctx<FAQPage>({
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: l(f.question, locale),
      acceptedAnswer: { '@type': 'Answer', text: l(f.answer, locale) },
    })),
  });
}

export function howToSchema(input: { name: string; description?: string; totalTime?: string; steps: { name: string; text: string; url?: string }[] }) {
  return ctx<HowTo>({
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    totalTime: input.totalTime,
    step: input.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text, url: s.url })),
  });
}

export function courseSchema(input: { name: string; description: string; url: string; providerName: string; mode?: 'onsite' | 'online' | 'blended' }) {
  return ctx<Course>({
    '@type': 'Course',
    name: input.name,
    description: input.description,
    url: input.url,
    provider: { '@type': 'EducationalOrganization', '@id': ORG_ID, name: input.providerName, url: env.siteUrl },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: input.mode ?? 'onsite' },
  });
}

export function eventSchema(input: {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate?: string;
  online: boolean;
  venue?: string;
  image?: string;
}) {
  return ctx<Event>({
    '@type': 'Event',
    name: input.name,
    description: input.description,
    url: input.url,
    startDate: input.startDate,
    endDate: input.endDate,
    image: input.image,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: input.online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: input.online
      ? { '@type': 'VirtualLocation', url: input.url }
      : { '@type': 'Place', name: input.venue, address: input.venue },
    organizer: { '@id': ORG_ID },
  });
}

export function personSchema(input: { name: string; jobTitle: string; url: string; image?: string; knowsLanguage?: string[]; description?: string }) {
  return ctx<Person>({
    '@type': 'Person',
    name: input.name,
    jobTitle: input.jobTitle,
    url: input.url,
    image: input.image,
    knowsLanguage: input.knowsLanguage,
    description: input.description,
    worksFor: { '@id': ORG_ID },
  });
}

export function articleSchema(input: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: { name: string; url?: string };
}) {
  return ctx<Article>({
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: input.url,
    image: input.image,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: { '@type': 'Person', name: input.author.name, url: input.author.url },
    publisher: { '@id': ORG_ID },
  });
}

/** WebPage with Speakable: marks answer-first sections for voice assistants. */
export function speakableWebPageSchema(input: { name: string; url: string; dateModified: string; cssSelectors?: string[] }) {
  return ctx<WebPage>({
    '@type': 'WebPage',
    name: input.name,
    url: input.url,
    dateModified: input.dateModified,
    isPartOf: { '@id': WEBSITE_ID },
    speakable: { '@type': 'SpeakableSpecification', cssSelector: input.cssSelectors ?? ['[data-speakable]'] },
  });
}

export function universitySchema(input: { name: string; url: string; city: string; country: string; website?: string | null; description?: string }) {
  return ctx<CollegeOrUniversity>({
    '@type': 'CollegeOrUniversity',
    name: input.name,
    url: input.website ?? input.url,
    description: input.description,
    address: { '@type': 'PostalAddress', addressLocality: input.city, addressCountry: input.country },
    ...(input.website ? { sameAs: [input.website] } : {}),
    subjectOf: { '@type': 'WebPage', url: input.url },
  });
}

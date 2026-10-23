import type { Metadata } from 'next';
import { absoluteUrl, languageAlternates } from './urls';

type PageMetaInput = {
  locale: string;
  /** Path without locale prefix, e.g. "/study-in/uk". */
  path: string;
  /** ≤ 60 chars. The site name is appended by the root title template unless `absoluteTitle` is set. */
  title: string;
  /** Use the title verbatim (needed on the home page, which the layout template does not wrap). */
  absoluteTitle?: boolean;
  /** ≤ 155 chars. */
  description: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
};

/** Builds canonical, hreflang, Open Graph and Twitter metadata for a page. */
export function pageMetadata({ locale, path, title, absoluteTitle, description, image, noindex, type = 'website' }: PageMetaInput): Metadata {
  if (process.env.NODE_ENV !== 'production') {
    if (title.length > 60) console.warn(`[seo] title > 60 chars on ${path}: "${title}"`);
    if (description.length > 155) console.warn(`[seo] description > 155 chars on ${path}`);
  }
  const url = absoluteUrl(locale, path);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      url,
      title,
      description,
      locale: locale === 'ne' ? 'ne_NP' : 'en_US',
      alternateLocale: locale === 'ne' ? ['en_US'] : ['ne_NP'],
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

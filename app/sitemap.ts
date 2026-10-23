import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { publicRoutes } from '@/lib/seo/routes';
import { absoluteUrl, languageAlternates } from '@/lib/seo/urls';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await publicRoutes();
  return routes.flatMap((r) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, r.path),
      lastModified: r.lastModified,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: { languages: languageAlternates(r.path) },
    })),
  );
}

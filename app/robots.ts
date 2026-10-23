import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

const PRIVATE = ['/api/', '/admin', '/en/portal', '/ne/portal'];

// Reputable search and AI crawlers are explicitly welcomed so the brand can be cited in AI answers.
const AI_AND_SEARCH_BOTS = [
  'Googlebot', 'Bingbot', 'Google-Extended', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Applebot', 'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  // Keep preview/staging deployments out of the index entirely.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      { userAgent: AI_AND_SEARCH_BOTS, allow: '/', disallow: PRIVATE },
      { userAgent: '*', allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}

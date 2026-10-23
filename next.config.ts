import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { redirects } from './data/redirects';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    globalNotFound: true,
  },
  // Blog posts are read from disk at render time; include them in serverless bundles.
  outputFileTracingIncludes: { '/*': ['./content/**/*'] },
  images: {
    formats: ['image/avif', 'image/webp'],
    // 60 for full-bleed heroes under a dark overlay (visually identical, much smaller); 75 elsewhere.
    qualities: [60, 75],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      ...(supabaseHost ? [{ protocol: 'https' as const, hostname: supabaseHost }] : []),
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return redirects.map((r) => ({ ...r, permanent: true }));
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(nextConfig);

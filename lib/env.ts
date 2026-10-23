/** Typed access to public env vars. Server-only secrets are read where they're used. */
export const env = {
  // Own domain when set; otherwise the Vercel production address (e.g. stxavier.vercel.app), then local dev.
  siteUrl: (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`) ||
    'http://localhost:3000'
  ).replace(/\/$/, ''),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? '',
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? '',
  isProduction: process.env.NODE_ENV === 'production',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

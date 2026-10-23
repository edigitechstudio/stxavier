/** Typed access to public env vars. Server-only secrets are read where they're used. */
export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID ?? '',
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID ?? '',
  isProduction: process.env.NODE_ENV === 'production',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Which optional sign-in methods are switched on in Supabase (Authentication → Sign In / Providers).
 * The Google button is only shown when Google is enabled there; otherwise Supabase would answer the
 * click with a raw "provider is not enabled" error. Re-checked every few minutes.
 */
export async function getAuthProviders(): Promise<{ google: boolean }> {
  'use cache';
  cacheTag('auth-providers');
  cacheLife('minutes');
  if (!isSupabaseConfigured) return { google: false };
  try {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/settings`, { headers: { apikey: env.supabaseAnonKey } });
    if (!res.ok) return { google: false };
    const settings = (await res.json()) as { external?: Record<string, boolean> };
    return { google: settings.external?.google === true };
  } catch {
    return { google: false };
  }
}

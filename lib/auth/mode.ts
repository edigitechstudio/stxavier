import { env, isSupabaseConfigured } from '@/lib/env';

/**
 * Demo sign-in for local development when Supabase isn't configured: one click signs you in as a
 * sample student / counsellor / admin backed by an in-memory store. Impossible in production.
 */
export const demoAuth = !isSupabaseConfigured && !env.isProduction;

export const DEMO_COOKIE = 'sx_demo_user';

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Cookie-less anon client for reading published content. Safe to call inside `'use cache'`
 * scopes because it never touches request data. RLS limits it to published rows.
 */
export function createPublicClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

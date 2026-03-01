import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for browser/client components.
 * Singleton — safe to call multiple times.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * OAuth / email-OTP callback handler.
 *
 * Supabase redirects here after a provider (Google, etc.) authenticates the
 * user. The URL contains a one-time `code` param that must be exchanged for a
 * session server-side.
 *
 * IMPORTANT: We create the Supabase client inline here (NOT via the shared
 * createSupabaseServerClient helper) so that setAll() does NOT swallow errors.
 * In a Route Handler cookies CAN be written; the try/catch in the shared helper
 * is only safe for Server Components where writing is intentionally a no-op.
 * Suppressing the error in a Route Handler would prevent the session cookie
 * from being persisted after the code exchange, breaking the auth flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/auth-redirect';

  // Provider-level errors (e.g. user denied consent)
  if (errorParam) {
    const msg = encodeURIComponent(errorDescription ?? errorParam);
    return NextResponse.redirect(`${origin}/auth/sign-in?error=${msg}`);
  }

  const safeNext = next.startsWith('/') ? next : '/auth-redirect';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          // No try/catch here — Route Handlers can write cookies, and the
          // session cookie MUST be set for the exchange to persist.
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_callback_failed`);
}

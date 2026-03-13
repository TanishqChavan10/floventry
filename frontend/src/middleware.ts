import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

/**
 * Routes that do NOT require authentication.
 */
const PUBLIC_PATHS = [
  '/',
  '/about',
  '/pricing',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth-redirect',
  '/invite/accept',
  '/onboarding',
  '/api/webhooks',
  '/api/public',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`),
  );
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // Refresh the session (important — keeps cookies alive)
  // NOTE: `getUser()` may fail transiently (network/Supabase hiccups). If we
  // have a session, treat the request as authenticated to avoid redirect loops.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    return response;
  }

  // If no session, redirect to sign-in.
  // If `getUser()` errored but we still have a session, allow through (prevents loops).
  if (!user && !session) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Pages only (public + private)
    '/((?!.+\\.(?:html|css|js|json|jpg|jpeg|webp|png|gif|svg|ttf|woff2|ico|csv|docx|xlsx|zip|webmanifest)$|_next).*)',

    // Protect only API routes that MUST be protected
    '/api/private/(.*)',
  ],
};

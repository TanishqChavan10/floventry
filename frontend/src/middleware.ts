import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/auth-redirect',
  '/sso-callback(.*)',
  '/invite/accept(.*)',
  '/onboarding(.*)',
  '/api/webhooks(.*)',   // Webhooks should remain public
  '/api/public(.*)',      // Optional: your public APIs
]);

export default clerkMiddleware((auth, request) => {
  // Skip auth for public routes
  if (isPublicRoute(request)) return;

  // Protect all other pages
  auth.protect();
}, {
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/auth/sign-in',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/auth/sign-up',
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/auth-redirect',
  afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/auth-redirect',
});

export const config = {
  matcher: [
    // Pages only (public + private)
    '/((?!.+\\.(?:html|css|js|json|jpg|jpeg|webp|png|gif|svg|ttf|woff2|ico|csv|docx|xlsx|zip|webmanifest)$|_next).*)',

    // Protect only API routes that MUST be protected
    '/api/private/(.*)',
  ],
};

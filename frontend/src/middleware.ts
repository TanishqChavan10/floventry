import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/api/webhooks(.*)',   // Webhooks should remain public
  '/api/public(.*)',      // Optional: your public APIs
]);

export default clerkMiddleware((auth, request) => {
  // Skip auth for public routes
  if (isPublicRoute(request)) return;

  // Protect all other pages
  auth.protect();
});

export const config = {
  matcher: [
    // Pages only (public + private)
    '/((?!.+\\.(?:html|css|js|json|jpg|jpeg|webp|png|gif|svg|ttf|woff2|ico|csv|docx|xlsx|zip|webmanifest)$|_next).*)',

    // Protect only API routes that MUST be protected
    '/api/private/(.*)',
  ],
};

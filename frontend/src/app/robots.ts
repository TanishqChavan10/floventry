import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth-redirect', '/onboarding'],
      },
    ],
    sitemap: 'https://floventry.online/sitemap.xml',
  };
}

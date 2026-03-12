// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import Providers from './providers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

/* ───────────── SEO Metadata ───────────── */

const SITE_URL = 'https://floventry.online';
const SITE_NAME = 'Floventry';
const DESCRIPTION =
  'Floventry: Smart inventory management built for Indian businesses. Track stock across warehouses, scan barcodes, manage suppliers, and streamline operations from one dashboard.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Inventory, Done Right.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'inventory management India',
    'stock tracking software',
    'warehouse management India',
    'barcode scanning app',
    'inventory software for Indian businesses',
    'stock management system',
    'supply chain India',
    'inventory control',
    'GST inventory management',
    'Indian warehouse software',
    'small business inventory India',
    'godown management software',
    'Floventry',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // Open Graph — shown on Facebook, LinkedIn, WhatsApp, etc.
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Smart Inventory Management`,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Inventory Management Dashboard`,
      },
    ],
  },

  // Twitter / X card
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Inventory, Simplified`,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: [{ url: '/4.svg', type: 'image/svg+xml', sizes: 'any' }],
    shortcut: [{ url: '/4.svg', type: 'image/svg+xml', sizes: 'any' }],
    apple: [{ url: '/4.svg', type: 'image/svg+xml', sizes: 'any' }],
  },

  // Canonical
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: '#E53935',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans min-h-screen flex flex-col`}>
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

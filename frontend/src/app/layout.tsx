// src/app/layout.tsx
'use client';
import { Poppins } from 'next/font/google';
import './globals.css';
import { useEffect } from 'react';

import { ClerkThemeProvider } from '@/components/ClerkThemeProvider';

// Providers
import { ApolloAppProvider } from '@/components/ApolloAppProvider';
import { WarehouseProvider } from '@/context/warehouse-context';
import { ThemeProvider } from '@/context/theme-context';

// UI Wrappers
import PageWrapper from '@/components/ui/PageWrapper';
import AppLayoutWrapper from './layout-wrapper';

// UI
import { Toaster } from '@/components/ui/sonner';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Set the document title for the browser tab
  useEffect(() => {
    document.title = 'Floventory';
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Floventory</title>
      </head>
      <body
        className={`${poppins.variable} font-sans min-h-screen flex flex-col`}
      >
        {/* --- 1) Theme Provider first for useTheme --- */}
        <ThemeProvider>
          {/* --- 2) Clerk (light only) --- */}
          <ClerkThemeProvider>
            {/* --- 3) Apollo loads AFTER Clerk (prevents redirect loops) --- */}
            <ApolloAppProvider>
              <WarehouseProvider>
                <PageWrapper>
                  <AppLayoutWrapper>
                    <main className="flex-1 min-h-screen">{children}</main>
                  </AppLayoutWrapper>

                  <Toaster richColors position="top-center" />
                </PageWrapper>
              </WarehouseProvider>
            </ApolloAppProvider>
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// src/app/layout.tsx
'use client';
import { Poppins } from 'next/font/google';
import './globals.css';

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
  variable: '--font-poppins'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} font-sans bg-white text-gray-800 dark:bg-black dark:text-gray-100 transition-colors duration-300 min-h-screen flex flex-col`}
      >
        {/* --- 1) Theme Provider first for useTheme --- */}
        <ThemeProvider>
          {/* --- 1) Theme Provider first for useTheme --- */}
          <ThemeProvider>
            {/* --- 2) Clerk with theme --- */}
            <ClerkThemeProvider>
              {/* --- 3) Apollo loads AFTER Clerk (prevents redirect loops) --- */}
              {/* --- 3) Apollo loads AFTER Clerk (prevents redirect loops) --- */}
              <ApolloAppProvider>
                <WarehouseProvider>
                  {/* --- 4) Page wrapper handles animations only (safe) --- */}
                  <PageWrapper>
                    {/* --- 5) Layout wrapper for navbar/footer etc. --- */}
                    <AppLayoutWrapper>
                      <main className="flex-1 min-h-screen">{children}</main>
                    </AppLayoutWrapper>

                    {/* Toasts */}
                    <Toaster richColors position="top-center" />
                  </PageWrapper>
                </WarehouseProvider>
              </ApolloAppProvider>
            </ClerkThemeProvider>
          </ThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

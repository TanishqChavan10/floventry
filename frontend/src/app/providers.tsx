'use client';

import { ApolloAppProvider } from '@/components/ApolloAppProvider';
import { WarehouseProvider } from '@/context/warehouse-context';
import { ThemeProvider } from '@/context/theme-context';
import { GlobalSearchProvider } from '@/components/search/GlobalSearchProvider';
import { LoadingProvider } from '@/context/loading-context';
import { GlobalLoadingBar } from '@/components/ui/GlobalLoadingBar';
import PageWrapper from '@/components/ui/PageWrapper';
import AppLayoutWrapper from './layout-wrapper';
import { Toaster } from '@/components/ui/sonner';
import { DesktopOnlyOverlay } from '@/components/common/DesktopOnlyOverlay';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopOnlyOverlay />
      <LoadingProvider>
        <ThemeProvider>
          <ApolloAppProvider>
            <WarehouseProvider>
              <GlobalSearchProvider>
                <PageWrapper>
                  <GlobalLoadingBar />
                  <AppLayoutWrapper>{children}</AppLayoutWrapper>
                  <Toaster richColors position="top-center" />
                </PageWrapper>
              </GlobalSearchProvider>
            </WarehouseProvider>
          </ApolloAppProvider>
        </ThemeProvider>
      </LoadingProvider>
    </>
  );
}

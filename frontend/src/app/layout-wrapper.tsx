'use client';

import AuthGuard from '@/components/AuthGuard';
import { Sidebar, SidebarBody, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Navbar } from '@/components/navigation/Navbar';
import { SidebarSection } from '@/components/navigation/SidebarSection';
import { SidebarItem } from '@/components/navigation/SidebarItem';
import { getCompanyNavigation, getWarehouseNavigation } from '@/lib/navigation-config';
import { IconUser, IconBell, IconLogout } from '@tabler/icons-react';
import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '@/context/auth-context';
import { useParams, usePathname } from 'next/navigation';

function BottomSection() {
  return null;
}

function AppSidebarContent() {
  const { user } = useAuth();
  const params = useParams();
  const pathname = usePathname();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;

  // Don't show sidebar if no user is authenticated
  if (!user) {
    return null;
  }

  // Get navigation configuration based on context
  let navigationSections = [];
  
  // Use warehouse navigation if we're in a warehouse route OR on the warehouses list page
  const isWarehousesListPage = pathname?.includes('/warehouses') && !warehouseSlug;
  
  if (warehouseSlug || isWarehousesListPage) {
    // For warehouses list page, we don't have a specific warehouse, so pass empty string
    navigationSections = getWarehouseNavigation(companySlug, warehouseSlug || '');
  } else {
    navigationSections = getCompanyNavigation(companySlug);
  }
  
  const filteredSections = navigationSections; // Show all sections without role filtering

  return (
    <SidebarBody className="justify-between gap-10">
      <div
        className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Logo/Brand (optional) */}
        <div className="mb-6 px-3">
          <Link href={`/${companySlug}/${warehouseSlug}`}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Flowventory
            </h1>
          </Link>
        </div>



        {/* Main Navigation Sections */}
        <div className="flex-1">
          {filteredSections.map((section, index) => (
            <SidebarSection key={index} title={section.title}>
              {section.items.map((item) => (
                <SidebarItem key={item.href} {...item} />
              ))}
            </SidebarSection>
          ))}


        </div>

        {/* Bottom Section */}
        <BottomSection />
      </div>
    </SidebarBody>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show sidebar for landing page, auth pages, onboarding, invite, and profile pages
  const shouldShowSidebar = 
    !pathname?.startsWith('/auth') && 
    !pathname?.startsWith('/onboarding') &&
    !pathname?.startsWith('/invite') &&
    !pathname?.startsWith('/profile') &&
    !pathname?.startsWith('/notifications') &&
    pathname !== '/';

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
        {/* Sidebar - only show for authenticated pages that are not landing/auth */}
        {shouldShowSidebar && (
          <SidebarProvider>
            <Sidebar>
              <AppSidebarContent />
            </Sidebar>
          </SidebarProvider>
        )}

        {/* Main Content */}
        <main className={`flex-1 flex flex-col overflow-hidden ${shouldShowSidebar ? '' : 'w-full'}`}>
          {shouldShowSidebar && <Navbar />}
          <div className="flex-1 overflow-y-auto">
             {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

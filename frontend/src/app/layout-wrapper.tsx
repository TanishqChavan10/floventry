'use client';

import AuthGuard from '@/components/AuthGuard';
import { ManagerGuard } from '@/components/guards/ManagerGuard';
import { Sidebar, SidebarBody, SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Navbar } from '@/components/navigation/Navbar';
import { SidebarSection } from '@/components/navigation/SidebarSection';
import { SidebarItem } from '@/components/navigation/SidebarItem';
import { getCompanyNavigation, getWarehouseNavigation } from '@/lib/navigation-config';
import { IconUser, IconBell, IconLogout } from '@tabler/icons-react';
import { useClerk, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '@/context/auth-context';
import { useParams, usePathname } from 'next/navigation';

function BottomSection() {
  const { user } = useAuth();
  const { open } = useSidebar();
  
  if (!user) return null;

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2">
      <div className={cn(
        "flex items-center rounded-xl transition-all duration-300 ease-out group",
        open ? "gap-3 px-3 mx-2 py-2.5" : "justify-center mx-1 px-0 py-2.5",
        "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      )}>
        {/* Clerk UserButton with custom appearance */}
        <div className="flex-shrink-0">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
                userButtonPopoverCard: "shadow-lg",
              }
            }}
            afterSignOutUrl="/auth/sign-in"
          >
            <UserButton.MenuItems>
              <UserButton.Link
                label="Profile"
                labelIcon={<IconUser className="h-4 w-4" />}
                href="/profile"
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
        
        {/* User Info - Only visible when sidebar is open */}
        {open && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
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
      <ManagerGuard>
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
      </ManagerGuard>
    </AuthGuard>
  );
}

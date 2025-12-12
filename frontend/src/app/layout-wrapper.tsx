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
  const { signOut } = useClerk();
  const { open, animate } = useSidebar();
  const params = useParams();
  const companySlug = params?.slug as string;

  const bottomItems = [
    {
      label: 'Profile',
      href: '/profile',
      icon: IconUser,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: IconBell,
    },
  ];

  return (
    <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <div className="space-y-1 mb-2">
        {bottomItems.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => signOut()}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'text-red-600 dark:text-red-400',
          'hover:bg-red-50 dark:hover:bg-red-950/30',
          'transition-all duration-200',
        )}
      >
        <IconLogout className="h-5 w-5 shrink-0" />
        <motion.span
          animate={{
            display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="text-sm font-medium whitespace-nowrap"
        >
          Sign Out
        </motion.span>
      </button>
    </div>
  );
}

function AppSidebarContent() {
  const { user } = useAuth();
  const params = useParams();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;

  // Don't show sidebar if no user is authenticated
  if (!user) {
    return null;
  }

  // Get navigation configuration based on context
  let navigationSections = [];
  if (warehouseSlug) {
    navigationSections = getWarehouseNavigation(companySlug, warehouseSlug);
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

  // Don't show sidebar for landing page and auth pages
  const shouldShowSidebar = !pathname?.startsWith('/auth') && pathname !== '/';

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

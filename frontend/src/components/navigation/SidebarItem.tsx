'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useSidebar } from '@/components/ui/sidebar';

interface SidebarItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function SidebarItem({ label, href, icon: Icon, onClick }: SidebarItemProps) {
  const pathname = usePathname();
  const { open, animate } = useSidebar();

  // Check if current route matches this item
  // Special handling: Don't mark company root as active when in warehouse routes
  const isActive = (() => {
    if (pathname === href) return true;

    // If href is a company root (e.g., /company-slug) and we're in a warehouse route,
    // don't mark as active
    if (href.match(/^\/[^\/]+$/) && pathname?.includes('/warehouses/')) {
      return false;
    }

    // For other routes, check if current path starts with href
    return pathname?.startsWith(href + '/');
  })();

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative flex items-center py-2.5 rounded-xl transition-all duration-300 ease-out group overflow-hidden',
        open ? 'gap-3 px-3 mx-2' : 'justify-center mx-1 px-0', // Adjusted spacing for collapsed state
        isActive
          ? 'bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/40 dark:to-transparent text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100/50 dark:border-indigo-900/20'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200',
      )}
    >
      {/* Active Indicator - Floating Pill REMOVED */}

      {/* Icon with hover effect */}
      <div
        className={cn(
          'relative flex items-center justify-center p-0.5 rounded-md transition-all duration-300',
          isActive
            ? 'bg-indigo-100/50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
            : 'bg-transparent',
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110',
            isActive
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200',
          )}
        />
      </div>

      {/* Label with animation */}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
          x: animate ? (open ? 0 : -10) : 0,
        }}
        className={cn('text-[0.925rem] font-medium whitespace-nowrap tracking-tight')}
      >
        {label}
      </motion.span>
    </Link>
  );
}

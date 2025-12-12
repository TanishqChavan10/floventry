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
}

export function SidebarItem({ label, href, icon: Icon }: SidebarItemProps) {
  const pathname = usePathname();
  const { open, animate } = useSidebar();

  // Check if current route matches this item
  const isActive = pathname === href || pathname?.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'transition-all duration-200',
        'group relative',
        isActive
          ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          'h-5 w-5 shrink-0',
          isActive
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100'
        )}
      />

      {/* Label with animation */}
      <motion.span
        animate={{
          display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          'text-sm font-medium whitespace-nowrap',
          'group-hover:translate-x-0.5 transition-transform duration-150'
        )}
      >
        {label}
      </motion.span>
    </Link>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useSidebar } from '@/components/ui/sidebar';
import { Crown } from 'lucide-react';
import { usePlanTier } from '@/hooks/usePlanTier';

interface SidebarItemProps {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  planRequired?: 'Standard' | 'Pro';
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function SidebarItem({ label, href, icon: Icon, planRequired, onClick }: SidebarItemProps) {
  const pathname = usePathname();
  const { open, animate } = useSidebar();
  const { plan } = usePlanTier();

  const PLAN_RANK = { Free: 0, Standard: 1, Pro: 2 } as const;
  const showPlanBadge = planRequired && PLAN_RANK[plan] < PLAN_RANK[planRequired];

  // Check if current route matches this item
  // Special handling: Don't mark company root as active when in warehouse routes
  const isActive = (() => {
    if (pathname === href) return true;

    // If href is a warehouse overview root (e.g., /company/warehouses/warehouse),
    // only treat it as active on the exact page (not on sub-pages).
    if (href.match(/^\/[^\/]+\/warehouses\/[^\/]+$/)) {
      return false;
    }

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
          ? 'bg-muted text-foreground border border-border'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className={cn(
            'absolute top-2 bottom-2 w-1 rounded-full bg-primary',
            open ? 'left-1' : 'left-0.5',
          )}
        />
      )}

      {/* Icon with hover effect */}
      <div
        className={cn(
          'relative flex items-center justify-center p-0.5 rounded-md transition-all duration-300',
          isActive ? 'bg-background border border-border text-primary' : 'bg-transparent',
        )}
      >
        <Icon
          className={cn(
            'h-6 w-6 shrink-0 transition-transform duration-300 group-hover:scale-110',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
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

      {/* Plan badge for gated features */}
      {showPlanBadge && open && <Crown className="ml-auto h-3.5 w-3.5 shrink-0 text-amber-500" />}
    </Link>
  );
}

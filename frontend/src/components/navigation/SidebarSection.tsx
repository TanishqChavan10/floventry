'use client';

import React from 'react';
import { cn } from '@/lib/utils';

import { useSidebar } from '@/components/ui/sidebar';

interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SidebarSection({ title, children, className }: SidebarSectionProps) {
  const { open } = useSidebar();

  return (
    <div className={cn('', className)}> {/* No bottom margin for equal spacing */}
      {title && open && (
        <div className="px-5 mb-2 flex items-center gap-2">
          <h3 className="text-[0.65rem] font-bold text-neutral-400/80 dark:text-neutral-500 uppercase tracking-[0.15em] leading-none">
            {title}
          </h3>
          <div className="h-px bg-gradient-to-r from-neutral-200 to-transparent dark:from-neutral-800 flex-1" />
        </div>
      )}
      <div className="space-y-0.5">{children}</div> {/* Consistent vertical spacing for all items */}
    </div>
  );
}

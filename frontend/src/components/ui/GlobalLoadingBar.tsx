'use client';

import { useLoadingContext } from '@/context/loading-context';
import { cn } from '@/lib/utils';

/**
 * A thin animated progress bar pinned to the very top of the viewport.
 * Appears whenever *any* `useAsyncAction` call is in-flight.
 */
export function GlobalLoadingBar() {
  const { isLoading } = useLoadingContext();

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden pointer-events-none',
        'transition-opacity duration-300',
        isLoading ? 'opacity-100' : 'opacity-0',
      )}
      aria-hidden="true"
    >
      <div className="h-full w-full bg-primary/20">
        <div className="h-full animate-loading-bar bg-primary rounded-full" />
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { BarcodeScanInput } from '@/components/barcode/BarcodeScanInput';

export type BarcodeScanContext = 'ISSUE' | 'TRANSFER' | 'GRN' | 'OPENING_STOCK' | 'ADJUSTMENT';

const CONTEXT_ROUTE_HINTS: Record<BarcodeScanContext, string[]> = {
  ISSUE: ['/issues/new'],
  TRANSFER: ['/inventory/transfers/new'],
  GRN: ['/inventory/grn'],
  OPENING_STOCK: ['/inventory/stock'],
  ADJUSTMENT: ['/inventory/adjustments'],
};

function isAllowedPath(pathname: string, context: BarcodeScanContext): boolean {
  const hints = CONTEXT_ROUTE_HINTS[context];
  return hints.some((h) => pathname.includes(h));
}

/**
 * Guardrail wrapper around BarcodeScanInput.
 *
 * Purpose:
 * - Make barcode scanning "opt-in" per physical flow.
 * - Prevent accidental rendering in the wrong context.
 *
 * Security model:
 * - Not a security boundary (backend still enforces stock rules).
 * - A UI safety boundary to reduce misuse.
 */
export function SafeBarcodeScanInput(
  props: React.ComponentProps<typeof BarcodeScanInput> & {
    context: BarcodeScanContext;
    enforceRoute?: boolean;
  },
) {
  const pathname = usePathname() || '';
  const enforceRoute = props.enforceRoute ?? true;

  if (enforceRoute && !isAllowedPath(pathname, props.context)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[SafeBarcodeScanInput] Blocked render outside allowed route. context=${props.context} pathname=${pathname}`,
      );
    }

    // Silent fail is intentional: do not encourage barcode usage in the wrong context.
    return null;
  }

  const { context: _context, enforceRoute: _enforceRoute, ...rest } = props;
  return <BarcodeScanInput {...rest} />;
}

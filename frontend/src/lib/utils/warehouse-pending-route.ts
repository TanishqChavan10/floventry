'use client';

const STORAGE_KEY_PREFIX = 'flowventory:pendingWarehouseRoute:';

function key(companySlug: string): string {
  return `${STORAGE_KEY_PREFIX}${companySlug}`;
}

export function setPendingWarehouseRoute(companySlug: string, routeSuffix: string): void {
  if (typeof window === 'undefined') return;
  try {
    // routeSuffix should start with '/' (e.g. '/inventory/stock')
    const normalized = routeSuffix.startsWith('/') ? routeSuffix : `/${routeSuffix}`;
    window.sessionStorage.setItem(key(companySlug), normalized);
  } catch {
    // ignore storage failures
  }
}

export function getPendingWarehouseRoute(companySlug: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key(companySlug));
  } catch {
    return null;
  }
}

export function clearPendingWarehouseRoute(companySlug: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key(companySlug));
  } catch {
    // ignore
  }
}

export function extractWarehouseRouteSuffix(companySlug: string, href: string): string | null {
  // From a href like '/acme/warehouses//inventory/stock' or '/acme/warehouses/inventory',
  // return '/inventory/stock' or '/inventory'. Returns null if not a warehouse-scoped href.
  const prefix = `/${companySlug}/warehouses/`;
  if (!href.startsWith(prefix)) return null;

  const rest = href.slice(prefix.length);

  // If there is no warehouse slug selected, rest often starts with '/...'
  // (because the slug part is empty). If a warehouse slug exists, rest starts with '{slug}/...'
  if (rest.length === 0) return '/';

  // When warehouse slug is missing, the first char is '/' and rest is already the suffix.
  if (rest.startsWith('/')) {
    return rest;
  }

  // When a warehouse slug exists, remove the slug segment and return the remainder.
  const firstSlash = rest.indexOf('/');
  if (firstSlash === -1) return '/';
  return rest.slice(firstSlash);
}

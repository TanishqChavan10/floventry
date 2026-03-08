import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';
import { cache } from './cache';
import { createLinks, type GetAuthToken } from './links';

// Max cache size in bytes (~2 MB)
const MAX_CACHE_SIZE = 2 * 1024 * 1024;

/** localStorage key used by apollo3-cache-persist. Exported for cleanup. */
export const CACHE_PERSISTENCE_KEY = 'floventry-apollo-cache';

/**
 * Create the single Apollo Client instance for the application.
 *
 * @param getAuthToken  Async callback that returns the current auth token.
 *                      Injected by the provider so the client stays auth-agnostic.
 */
export function createApolloClient(getAuthToken: GetAuthToken) {
  return new ApolloClient({
    link: createLinks(getAuthToken),
    cache,
    connectToDevTools: process.env.NODE_ENV === 'development',
    queryDeduplication: true,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
      },
    },
  });
}

/**
 * Initialize cache persistence (localStorage).
 * Call once after client creation. Non-blocking — resolves when hydration completes.
 * Only persists safe data; sensitive auth data stays in memory only.
 */
export async function initCachePersistence(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await persistCache({
      cache,
      storage: new LocalStorageWrapper(window.localStorage),
      maxSize: MAX_CACHE_SIZE,
      key: CACHE_PERSISTENCE_KEY,
      debug: process.env.NODE_ENV === 'development',
    });
  } catch (err) {
    console.warn('[Apollo] Cache persistence failed, starting fresh:', err);
  }
}

/**
 * Wipe persisted cache from localStorage.
 * Call on logout or when tenant context changes to prevent cross-tenant leakage.
 */
export function clearPersistedCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CACHE_PERSISTENCE_KEY);
  } catch {
    // localStorage may be blocked by browser settings — safe to ignore
  }
}

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import { useApolloClient } from '@apollo/client';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { clearPersistedCache } from '@/lib/apollo/client';
import { useCurrentUser } from '@/hooks/apollo';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface Company {
  id: string;
  name: string;
  slug: string;
  role: string;
  isActive: boolean;
}

interface Warehouse {
  warehouseId: string;
  warehouseName: string;
  warehouseSlug: string;
  isManager: boolean;
}

interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  activeCompanyId?: string;
  companies?: Company[];
  warehouses?: Warehouse[];
  defaultWarehouseId?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  /** True once Supabase session has been checked. */
  isLoaded: boolean;
  /** True if Supabase has an active session. */
  isSignedIn: boolean;
  error: Error | null;
  supabaseUser: SupabaseUser | null;
  signOut: () => void;
  /** Get the current access token for API calls. */
  getToken: () => Promise<string | null>;
  /** The raw Supabase session (null when signed out). */
  session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabase = createSupabaseBrowserClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);

  const isSignedIn = !!session;
  const apolloClient = useApolloClient();
  const prevAccessTokenRef = useRef<string | null>(null);

  // Initialize: get current session + listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setSupabaseUser(s?.user ?? null);
      setIsLoaded(true);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setSupabaseUser(s?.user ?? null);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Store token on window for REST API helpers (barcode-labels, etc.)
  useEffect(() => {
    if (session?.access_token && typeof window !== 'undefined') {
      (window as any).__supabase_access_token = session.access_token;
    } else if (typeof window !== 'undefined') {
      (window as any).__supabase_access_token = null;
    }
  }, [session]);

  // When a new session appears (fresh sign-in), force Apollo to refetch `me`
  // under the new token to avoid redirect loops caused by stale cached `me=null`.
  useEffect(() => {
    const token = session?.access_token ?? null;

    // Signed out
    if (!token) {
      prevAccessTokenRef.current = null;
      return;
    }

    // Token newly set or changed (sign-in / session refresh)
    if (prevAccessTokenRef.current !== token) {
      prevAccessTokenRef.current = token;

      // While we refetch, keep auth in a loading state so guards don't bounce.
      setInternalLoading(true);

      (async () => {
        try {
          // Clears in-memory cache and refetches active queries (including `Me`).
          await apolloClient.resetStore();
        } catch {
          // If resetStore fails, the `useCurrentUser` hook will still retry.
        }
      })();
    }
  }, [session?.access_token, apolloClient]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const { data, loading, error } = useCurrentUser();

  // Sync user state from query result
  useEffect(() => {
    if (!loading && data) {
      setUser(data?.me || null);
      setInternalLoading(false);
    }
  }, [data, loading]);

  // Expose a minimal company lookup for non-React code (Apollo links).
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const w = window as any;
    const companies = user?.companies || [];
    w.__company_slug_to_id = companies.reduce((acc: Record<string, string>, c) => {
      if (c?.slug && c?.id) acc[c.slug] = c.id;
      return acc;
    }, {});

    // Keep this in sync so GraphQL requests always carry tenant context.
    w.__active_company_id = user?.activeCompanyId || undefined;
  }, [user?.companies, user?.activeCompanyId]);

  useEffect(() => {
    if (error) {
      setUser(null);
      setInternalLoading(false);
    }
  }, [error]);

  // When signed out: clear state
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setUser(null);
      setInternalLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const handleSignOut = useCallback(async () => {
    // Clear Apollo in-memory cache (no refetch) + wipe persisted cache
    clearPersistedCache();
    await apolloClient.clearStore();

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSupabaseUser(null);
  }, [apolloClient]);

  const isAuthResolved = isLoaded && !internalLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: isSignedIn && !!user,
        loading: !isAuthResolved || loading,
        isLoaded: isLoaded,
        isSignedIn: isSignedIn,
        error: error || null,
        supabaseUser: supabaseUser,
        signOut: handleSignOut,
        getToken,
        session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
}

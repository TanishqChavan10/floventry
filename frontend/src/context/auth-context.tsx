'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { GET_CURRENT_USER } from '@/lib/graphql/auth';

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
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  role: string;
  isActive: boolean;
  companies?: Company[];
  activeCompanyId?: string;
  warehouses?: Warehouse[];
  defaultWarehouseId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  /** True once Clerk SDK has initialized (happens in milliseconds). */
  isClerkLoaded: boolean;
  /** True if Clerk considers the user signed in (even before DB user loads). */
  isClerkSignedIn: boolean;
  error: Error | null;
  clerkUser: any;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const [user, setUser] = useState<User | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const [tokenReady, setTokenReady] = useState(false);

  // Ensure token is available before making queries
  useEffect(() => {
    const setupToken = async () => {
      if (isSignedIn && isLoaded) {
        try {
          const token = await getToken();
          if (token && typeof window !== 'undefined') {
            (window as any).__clerk_session_token = token;
            // Small delay to ensure token is set before queries run
            setTimeout(() => setTokenReady(true), 100);
          } else {
            setTokenReady(false);
          }
        } catch (err) {
          console.error('Error setting up token:', err);
          setTokenReady(false);
        }
      } else {
        setTokenReady(false);
      }
    };
    setupToken();
  }, [isSignedIn, isLoaded, getToken]);

  const { data, loading, error } = useQuery(GET_CURRENT_USER, {
    skip: !isSignedIn || !isLoaded || !tokenReady,
    fetchPolicy: 'network-only', // Always fetch fresh user data
    errorPolicy: 'all', // Don't throw on errors, handle them gracefully
    onCompleted: (data) => {
      setUser(data?.me || null);
      setInternalLoading(false);
    },
    onError: (err) => {
      // Silently handle auth errors - user will just not be authenticated
      setUser(null);
      setInternalLoading(false);
    },
  });

  // When Clerk signs out: only clear state once Clerk is fully loaded.
  // Guarding with `isLoaded` prevents a premature `internalLoading = false`
  // on initial mount before the Clerk SDK has hydrated (where isSignedIn is
  // temporarily falsy), which would make `loading` briefly false before the
  // DB user query has even started and cause redirect loops.
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setUser(null);
      setInternalLoading(false);
      setTokenReady(false);
    }
  }, [isLoaded, isSignedIn]);

  const isAuthResolved = isLoaded && !internalLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!isSignedIn && !!user,
        loading: !isAuthResolved || loading,
        isClerkLoaded: isLoaded,
        isClerkSignedIn: !!isSignedIn,
        error: error || null,
        clerkUser,
        signOut,
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

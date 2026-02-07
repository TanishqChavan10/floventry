'use client';

import { ApolloProvider } from '@apollo/client';
import { useAuth } from '@clerk/nextjs';
import React from 'react';
import { createApolloClient } from '@/lib/apollo-client';
import { AuthProvider } from '@/context/auth-context';

export function ApolloAppProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, getToken, isSignedIn } = useAuth();

  const client = React.useMemo(() => {
    return createApolloClient(async () => {
      if (!isLoaded || !isSignedIn) return null;
      return getToken();
    });
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) {
    // Prevent Apollo from running before Clerk is ready
    return null;
  }

  return (
    <ApolloProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}

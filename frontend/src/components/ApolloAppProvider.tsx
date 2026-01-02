'use client';

import { ApolloProvider } from '@apollo/client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useCallback } from 'react';
import client from '@/lib/apollo-client';
import { AuthProvider } from '@/context/auth-context';

export function ApolloAppProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, getToken, isSignedIn } = useAuth();

  const updateToken = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      if (typeof window !== 'undefined') {
        (window as any).__clerk_session_token = null;
      }
      return;
    }

    try {
      const token = await getToken();
      if (typeof window !== 'undefined') {
        (window as any).__clerk_session_token = token;
      }
    } catch (error) {
      console.error('Failed to get token:', error);
      if (typeof window !== 'undefined') {
        (window as any).__clerk_session_token = null;
      }
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    // Update token immediately when auth state changes
    updateToken();

    // Set up periodic token refresh every 5 minutes (300000 ms)
    const interval = setInterval(updateToken, 300000);

    // Refresh token when user becomes active (clicks, scrolls, etc.)
    const handleActivity = () => {
      updateToken();
    };

    // Add activity listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('mousemove', handleActivity);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('mousemove', handleActivity);
      }
    };
  }, [updateToken]);

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

'use client';

import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { createApolloClient } from '@/lib/apollo-client';
import { AuthProvider } from '@/context/auth-context';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export function ApolloAppProvider({ children }: { children: React.ReactNode }) {
  const client = React.useMemo(() => {
    return createApolloClient(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, []);

  return (
    <ApolloProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}

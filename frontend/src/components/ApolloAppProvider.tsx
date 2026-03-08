'use client';

import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { createApolloClient, initCachePersistence } from '@/lib/apollo/client';
import { AuthProvider } from '@/context/auth-context';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export function ApolloAppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  const client = React.useMemo(() => {
    return createApolloClient(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });
  }, []);

  // Hydrate persistent cache on mount
  React.useEffect(() => {
    initCachePersistence().finally(() => setReady(true));
  }, []);

  // Render children immediately — cache hydration happens in the background.
  // The `ready` flag could be used for a loading state if desired.
  return (
    <ApolloProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}

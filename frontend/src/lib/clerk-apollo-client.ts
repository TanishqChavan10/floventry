// lib/clerk-apollo-client.ts

import { ApolloClient, InMemoryCache, ApolloLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { HttpLink } from "@apollo/client/link/http";

// Auth link that gets fresh token from window (updated by ApolloAppProvider)
const authLink = new ApolloLink((operation, forward) => {
  const token = typeof window !== 'undefined'
    ? (window as any).__clerk_session_token
    : null;

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    },
  }));

  return forward(operation);
});

// Error handling with token refresh on auth errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message }) => {
      console.error(`[GraphQL error]: ${message}`);

      // If we get an unauthorized error, try to refresh the token
      if (message.includes('Unauthorized') || message.includes('unauthorized')) {
        console.log('Token might be expired, refreshing...');
        // The token will be refreshed on next activity due to our activity listeners
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// HTTP link
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:5000/api/graphql",
});

// Final Apollo client
const clerkApolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

export default clerkApolloClient;

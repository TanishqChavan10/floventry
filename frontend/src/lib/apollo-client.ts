import { ApolloClient, InMemoryCache, from, ApolloLink, Observable } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { HttpLink } from "@apollo/client/link/http";
import { GRAPHQL_URL } from "@/config/env";

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message }) => {
      // Suppress auth-related errors to prevent console spam
      if (!message.includes('No token provided') &&
        !message.includes('Invalid or expired token') &&
        !message.includes('Unauthorized')) {
        console.error(`[GraphQL error]: ${message}`);
      }
    });

  // Suppress AbortError - these are expected when queries are canceled
  // (e.g., fast typing in search, navigation away from page, etc.)
  if (networkError && networkError.name !== 'AbortError') {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Auth link that gets token from window (set by ApolloAppProvider)
const authLink = new ApolloLink((operation, forward) => {
  const token = typeof window !== 'undefined'
    ? (window as any).__clerk_session_token
    : null;

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : "",
    }
  }));

  return forward(operation);
});

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;

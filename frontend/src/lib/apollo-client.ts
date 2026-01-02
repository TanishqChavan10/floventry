import { ApolloClient, InMemoryCache, from, ApolloLink, Observable } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { HttpLink } from "@apollo/client/link/http";

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
  if (networkError) console.error(`[Network error]: ${networkError}`);
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
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:5000/api/graphql",
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;

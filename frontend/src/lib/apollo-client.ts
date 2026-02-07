import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
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

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
});

export type GetAuthToken = () => Promise<string | null | undefined>;

export function createApolloClient(getAuthToken: GetAuthToken) {
  const authLink = setContext(async (_, { headers }) => {
    try {
      const token = await getAuthToken();
      return {
        headers: {
          ...headers,
          Authorization: token ? `Bearer ${token}` : "",
        },
      };
    } catch {
      return {
        headers: {
          ...headers,
          Authorization: "",
        },
      };
    }
  });

  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
  });
}

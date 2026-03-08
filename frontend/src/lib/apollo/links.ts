import { ApolloLink, HttpLink, split, Operation } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError, ErrorResponse } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { GRAPHQL_URL, WS_URL } from '@/config/env';

export type GetAuthToken = () => Promise<string | null | undefined>;

/**
 * Build the full Apollo link chain.
 *
 * HTTP path:  AuthLink → ErrorLink → RetryLink → HttpLink
 * WS path:    ErrorLink → WebSocketLink
 *
 * Traffic is split: subscriptions go over WebSocket,
 * queries and mutations go over HTTP.
 */
export function createLinks(getAuthToken: GetAuthToken): ApolloLink {
  // ── Auth Link ──
  const authLink = setContext(async (_, { headers }) => {
    try {
      const token = await getAuthToken();
      return {
        headers: {
          ...headers,
          Authorization: token ? `Bearer ${token}` : '',
        },
      };
    } catch {
      return { headers };
    }
  });

  // ── Error Link (structured logging) ──
  const errorLink = onError(({ graphQLErrors, networkError, operation }: ErrorResponse) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        const code = (err.extensions?.['code'] as string) ?? '';
        const status = (err.extensions?.['status'] as number) ?? 0;
        const msg = err.message;

        // 401 — session invalid
        if (code === 'UNAUTHENTICATED' || status === 401 || msg.includes('Unauthorized')) {
          console.warn('[Apollo] Session invalid — user should re-authenticate');
          continue;
        }

        // 403 — forbidden
        if (code === 'FORBIDDEN' || status === 403 || msg.includes('Forbidden')) {
          console.warn('[Apollo] Access denied:', msg);
          continue;
        }

        // Suppress expected validation errors
        const isExpectedValidation =
          /Barcode already assigned to another product in this company/i.test(msg);
        const isAuthNoise =
          msg.includes('No token provided') ||
          msg.includes('Invalid or expired token');

        if (!isExpectedValidation && !isAuthNoise) {
          // Structured error log
          console.error('[GraphQL error]', {
            operation: operation.operationName,
            variables: operation.variables,
            message: msg,
            code,
            path: err.path,
          });
        }
      }
    }

    if (networkError && networkError.name !== 'AbortError') {
      console.error('[Network error]', {
        operation: operation.operationName,
        message: networkError.message,
        stack: process.env.NODE_ENV === 'development' ? networkError.stack : undefined,
      });
    }
  });

  // ── Performance Link (dev-only query timing) ──
  const performanceLink = new ApolloLink((operation, forward) => {
    if (process.env.NODE_ENV !== 'development') return forward(operation);

    const startTime = performance.now();
    operation.setContext({ startTime });

    return forward(operation).map((result) => {
      const duration = Math.round(performance.now() - startTime);
      const name = operation.operationName || 'anonymous';

      if (duration > 1000) {
        console.warn(`[Apollo perf] SLOW ${name}: ${duration}ms`, {
          variables: operation.variables,
        });
      } else {
        console.debug(`[Apollo perf] ${name}: ${duration}ms`);
      }

      return result;
    });
  });

  // ── Retry Link ──
  const retryLink = new RetryLink({
    delay: { initial: 300, max: 3000, jitter: true },
    attempts: { max: 3, retryIf: (error) => !!error },
  });

  // ── HTTP Link ──
  const httpLink = new HttpLink({
    uri: GRAPHQL_URL,
  });

  // ── WebSocket Link (subscriptions) ──
  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: WS_URL,
            connectionParams: async () => {
              const token = await getAuthToken();
              return { Authorization: token ? `Bearer ${token}` : '' };
            },
            shouldRetry: () => true,
            retryAttempts: 5,
            retryWait: (retries) =>
              new Promise((resolve) =>
                setTimeout(resolve, Math.min(1000 * 2 ** retries, 30000)),
              ),
          }),
        )
      : null;

  // ── Link Split ──
  // Subscriptions → WebSocket, everything else → HTTP
  const httpChain = ApolloLink.from([authLink, performanceLink, errorLink, retryLink, httpLink]);

  if (!wsLink) return httpChain;

  return split(
    ({ query }: Operation) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    ApolloLink.from([errorLink, wsLink]),
    httpChain,
  );
}

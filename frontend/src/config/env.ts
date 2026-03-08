// Centralized runtime config.
// IMPORTANT: For NEXT_PUBLIC_* variables, Next.js only injects values into client
// bundles when accessed via static property access (e.g. process.env.NEXT_PUBLIC_X).
// Avoid dynamic indexing like process.env[name] in code that can run on the client.

type RequiredEnvOptions = {
  /**
   * Development-only default (used when NODE_ENV !== 'production').
   * This prevents hard crashes for local setup while still enforcing production config.
   */
  devDefault?: string;
};

function normalizeAbsoluteUrl(value: string, nameForErrors: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid ${nameForErrors}: ${value}`);
  }

  const normalized = url.toString();
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function assertNotLocalhostInProduction(value: string, name: string): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.NEXT_PUBLIC_ALLOW_LOCALHOST === 'true') return;

  let hostname: string;
  try {
    hostname = new URL(value).hostname;
  } catch {
    // If it's not a valid URL, another validator will throw.
    return;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    throw new Error(`${name} points to localhost in production: ${value}`);
  }
}

function requiredEnv(
  value: string | undefined,
  name: string,
  options?: RequiredEnvOptions,
): string {
  const normalized = value?.trim();
  if (normalized) return normalized;

  if (process.env.NODE_ENV !== 'production' && options?.devDefault) {
    return options.devDefault;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

function deriveApiUrlFromGraphqlUrl(graphqlUrl: string): string {
  let url: URL;
  try {
    url = new URL(graphqlUrl);
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_GRAPHQL_URL: ${graphqlUrl}`);
  }

  const normalizedPath = url.pathname.replace(/\/+$/, '');
  if (!normalizedPath.endsWith('/graphql')) {
    throw new Error(
      `NEXT_PUBLIC_GRAPHQL_URL must end with '/graphql' (got: ${graphqlUrl})`,
    );
  }

  url.pathname = normalizedPath.slice(0, -'/graphql'.length) || '/';
  url.search = '';
  url.hash = '';

  const apiUrl = url.toString();
  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
}

function normalizeApiUrl(apiUrl: string): string {
  // Accept any absolute URL (e.g. https://api.example.com/api)
  const normalized = normalizeAbsoluteUrl(apiUrl, 'NEXT_PUBLIC_API_URL');
  assertNotLocalhostInProduction(normalized, 'NEXT_PUBLIC_API_URL');
  return normalized;
}

function normalizeGraphqlUrl(graphqlUrl: string): string {
  // Must end with '/graphql'
  const normalized = normalizeAbsoluteUrl(graphqlUrl, 'NEXT_PUBLIC_GRAPHQL_URL');
  assertNotLocalhostInProduction(normalized, 'NEXT_PUBLIC_GRAPHQL_URL');

  // Keep existing validation semantics.
  // (deriveApiUrlFromGraphqlUrl also validates the suffix.)
  deriveApiUrlFromGraphqlUrl(normalized);
  return normalized;
}

// GraphQL endpoint (must end with '/graphql', usually '/api/graphql')
export const GRAPHQL_URL = (() => {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim();
  if (graphqlUrl) return normalizeGraphqlUrl(graphqlUrl);

  // Fallback: allow configuring only the REST API base and deriving GraphQL from it.
  // Example: NEXT_PUBLIC_API_URL=https://example.com/api -> GraphQL=https://example.com/api/graphql
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) return normalizeGraphqlUrl(`${normalizeApiUrl(apiUrl)}/graphql`);

  return normalizeGraphqlUrl(
    requiredEnv(process.env.NEXT_PUBLIC_GRAPHQL_URL, 'NEXT_PUBLIC_GRAPHQL_URL', {
      devDefault: 'http://localhost:5000/api/graphql',
    }),
  );
})();

// WebSocket URL for GraphQL subscriptions (derived from GRAPHQL_URL)
export const WS_URL = (() => {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicit) return explicit;

  // Derive from GRAPHQL_URL: http(s) → ws(s)
  return GRAPHQL_URL.replace(/^http/, 'ws');
})();

// REST base URL (usually '/api')
export const API_URL = (() => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) return normalizeApiUrl(apiUrl);
  return deriveApiUrlFromGraphqlUrl(GRAPHQL_URL);
})();

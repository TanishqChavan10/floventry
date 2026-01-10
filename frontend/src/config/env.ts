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

// GraphQL endpoint (must end with '/graphql', usually '/api/graphql')
export const GRAPHQL_URL = requiredEnv(
  process.env.NEXT_PUBLIC_GRAPHQL_URL,
  'NEXT_PUBLIC_GRAPHQL_URL',
  { devDefault: 'http://localhost:5000/api/graphql' },
);

// REST base URL derived from GRAPHQL_URL (usually '/api')
export const API_URL = deriveApiUrlFromGraphqlUrl(GRAPHQL_URL);

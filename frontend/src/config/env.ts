// Centralized runtime config.
// In Next.js, public env vars are injected at build time, so we avoid fallbacks
// that can accidentally ship localhost URLs to production builds.

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
export const GRAPHQL_URL = requiredEnv('NEXT_PUBLIC_GRAPHQL_URL');

// REST base URL derived from GRAPHQL_URL (usually '/api')
export const API_URL = deriveApiUrlFromGraphqlUrl(GRAPHQL_URL);

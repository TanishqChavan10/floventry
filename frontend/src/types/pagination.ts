// ── Cursor-based pagination types (matches backend relay-style API) ──

export interface CursorPaginationInput {
  first?: number;
  after?: string | null;
  search?: string;
}

export interface CursorPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
  totalCount: number;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: CursorPageInfo;
}

import { InMemoryCache, FieldPolicy } from '@apollo/client';

/**
 * Relay-style connection merge: appends new edges on fetchMore,
 * replaces on fresh fetch (no existing data or args change).
 * Deduplicates edges by cursor to prevent duplicates.
 */
function relayStyleMerge(): FieldPolicy {
  return {
    keyArgs: false,
    merge(existing, incoming) {
      if (!existing || !incoming) return incoming;

      // If the incoming has no edges, just return it (empty result)
      if (!incoming.edges?.length) return incoming;

      // Deduplicate edges by cursor
      const existingCursors = new Set(
        (existing.edges ?? []).map((e: { cursor: string }) => e.cursor),
      );

      const newEdges = incoming.edges.filter(
        (e: { cursor: string }) => !existingCursors.has(e.cursor),
      );

      return {
        ...incoming,
        edges: [...(existing.edges ?? []), ...newEdges],
      };
    },
  };
}

export const cache = new InMemoryCache({
  typePolicies: {
    // ── Entity normalization ──
    Product: { keyFields: ['id'] },
    Warehouse: { keyFields: ['id'] },
    PurchaseOrder: { keyFields: ['id'] },
    Supplier: { keyFields: ['id'] },
    Notification: { keyFields: ['id'] },
    Company: { keyFields: ['id'] },
    Stock: { keyFields: ['id'] },
    StockMovement: { keyFields: ['id'] },
    GoodsReceiptNote: { keyFields: ['id'] },
    SalesOrder: { keyFields: ['id'] },
    IssueNote: { keyFields: ['id'] },
    Category: { keyFields: ['id'] },
    Unit: { keyFields: ['id'] },
    StockLot: { keyFields: ['id'] },
    CompanyAuditLog: { keyFields: ['id'] },

    // ── Query field policies ──
    Query: {
      fields: {
        // Existing list queries (offset-based, backward compat)
        products: {
          keyArgs: false,
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        },
        purchaseOrders: {
          keyArgs: ['filters'],
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        },
        stockMovements: {
          keyArgs: ['filters', 'warehouseId'],
          merge(existing: any, incoming: any) {
            if (!existing) return incoming;
            if (incoming?.items) {
              return {
                ...incoming,
                items: [...(existing.items ?? []), ...incoming.items],
              };
            }
            return incoming;
          },
        },
        notifications: {
          keyArgs: false,
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        },
        companyStockMovements: {
          keyArgs: ['filters'],
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        },
        salesOrders: {
          keyArgs: false,
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        },
        issueNotesByCompany: {
          keyArgs: false,
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        },
        issueNotesByWarehouse: {
          keyArgs: ['warehouseId'],
          merge(existing = [], incoming: any[]) {
            return [...existing, ...incoming];
          },
        },

        // ── Relay-style connection queries ──
        productsConnection: relayStyleMerge(),
        purchaseOrdersConnection: relayStyleMerge(),
        stockMovementsConnection: relayStyleMerge(),
        notificationsConnection: relayStyleMerge(),
        auditLogsConnection: relayStyleMerge(),
      },
    },
  },
});

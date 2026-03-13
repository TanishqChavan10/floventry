'use client';

import { createContext, useContext } from 'react';
import type { PlanTier } from '@/hooks/usePlanTier';

export type GlobalSearchDocumentType = 'GRN' | 'ISSUE' | 'TRANSFER';

export type GlobalSearchProduct = {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
};

export type GlobalSearchWarehouse = {
  id: string;
  name: string;
  code?: string | null;
  status: string;
  slug?: string | null;
};

export type GlobalSearchDocument = {
  id: string;
  type: GlobalSearchDocumentType;
  number: string;
};

export type GlobalSearchSupplier = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type GlobalSearchCategory = {
  id: string;
  name: string;
  description?: string | null;
};

export type GlobalSearchPurchaseOrder = {
  id: string;
  po_number: string;
  status: string;
  supplier_name?: string | null;
};

export type GlobalSearchSalesOrder = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
};

export type GlobalSearchResultsData = {
  products: GlobalSearchProduct[];
  warehouses: GlobalSearchWarehouse[];
  documents: GlobalSearchDocument[];
  suppliers: GlobalSearchSupplier[];
  categories: GlobalSearchCategory[];
  purchaseOrders: GlobalSearchPurchaseOrder[];
  salesOrders: GlobalSearchSalesOrder[];
};

export type GlobalSearchContextValue = {
  companyPlan: PlanTier | null;

  open: boolean;
  setOpen: (open: boolean) => void;

  query: string;
  setQuery: (q: string) => void;

  loading: boolean;
  error: string | null;
  results: GlobalSearchResultsData;

  activeIndex: number;
  setActiveIndex: (index: number) => void;

  openPalette: () => void;
  closePalette: () => void;
  navigateToResult: (item:
    | { kind: 'product' | 'warehouse' | 'document' | 'supplier' | 'category' | 'purchaseOrder' | 'salesOrder'; id: string; type?: GlobalSearchDocumentType }
    | { kind: 'action'; id: 'create-warehouse' | 'create-company' | 'scan-barcode' }) => void;
};

export const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function useGlobalSearch(): GlobalSearchContextValue {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return ctx;
}

'use client';

import { createContext, useContext } from 'react';

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

export type GlobalSearchResultsData = {
  products: GlobalSearchProduct[];
  warehouses: GlobalSearchWarehouse[];
  documents: GlobalSearchDocument[];
};

export type GlobalSearchContextValue = {
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
    | { kind: 'product' | 'warehouse' | 'document'; id: string; type?: GlobalSearchDocumentType }
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

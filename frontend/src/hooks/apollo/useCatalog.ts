import { useQuery, useMutation, useLazyQuery, type LazyQueryHookOptions, type MutationHookOptions } from '@apollo/client';
import {
  GET_PRODUCTS,
  GET_PRODUCTS_PAGINATED,
  GET_PRODUCT,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  GENERATE_COMPANY_BARCODE,
  GET_CATEGORIES,
  GET_CATEGORY,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  GET_SUPPLIERS,
  GET_SUPPLIER,
  CREATE_SUPPLIER,
  UPDATE_SUPPLIER,
  ARCHIVE_SUPPLIER,
  UNARCHIVE_SUPPLIER,
  DELETE_SUPPLIER,
  GET_UNITS,
  GET_UNIT,
  CREATE_UNIT,
  UPDATE_UNIT,
  DELETE_UNIT,
  GET_CATALOG_STATS,
  GET_PRODUCTS_CONNECTION,
} from '@/lib/graphql';
import {
  PRODUCT_BY_BARCODE,
  PRODUCT_BY_BARCODE_DETAILS,
  BARCODE_HISTORY,
  PRODUCT_BARCODE_UNITS,
  UPSERT_PRODUCT_BARCODE_UNIT,
  REMOVE_PRODUCT_BARCODE_UNIT,
  GENERATE_BARCODE_LABELS,
} from '@/lib/graphql/barcode';
import {
  TOGGLE_CATEGORY_ACTIVE,
  TOGGLE_SUPPLIER_ACTIVE,
} from '@/lib/graphql/settings';
import { useCursorPagination } from './useCursorPagination';
import type { CursorPaginationInput } from '@/types/pagination';

// ── Products ──

export function useProducts() {
  return useQuery(GET_PRODUCTS, { fetchPolicy: 'cache-and-network' });
}

export function useProductsPaginated(variables?: { pagination?: { page?: number; limit?: number } }) {
  return useQuery(GET_PRODUCTS_PAGINATED, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
}

export function useProductsConnection(input?: CursorPaginationInput) {
  return useCursorPagination(
    GET_PRODUCTS_CONNECTION,
    'productsConnection',
    { variables: { input: input ?? { first: 20 } }, fetchPolicy: 'cache-and-network' },
  );
}

export function useProduct(id: string) {
  return useQuery(GET_PRODUCT, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCreateProduct() {
  return useMutation(CREATE_PRODUCT, {
    update(cache, { data }) {
      if (!data?.createProduct) return;
      cache.modify({
        fields: {
          products(existing = []) {
            const ref = cache.identify(data.createProduct);
            if (!ref) return existing;
            return [{ __ref: ref }, ...existing];
          },
          productsPaginated(existing: any) {
            if (!existing?.items) return existing;
            const ref = cache.identify(data!.createProduct);
            if (!ref) return existing;
            return {
              ...existing,
              items: [{ __ref: ref }, ...existing.items],
              total: (existing.total ?? 0) + 1,
            };
          },
        },
      });
    },
  });
}

export function useUpdateProduct() {
  return useMutation(UPDATE_PRODUCT);
}

export function useDeleteProduct() {
  return useMutation(DELETE_PRODUCT, {
    update(cache, { data }, { variables }) {
      if (!data?.removeProduct) return;
      cache.modify({
        fields: {
          products(existing = [], { readField }) {
            return existing.filter(
              (ref: any) => readField('id', ref) !== variables?.id,
            );
          },
          // Also remove from paginated results
          productsPaginated(existing: any, { readField }) {
            if (!existing?.items) return existing;
            return {
              ...existing,
              items: existing.items.filter(
                (ref: any) => readField('id', ref) !== variables?.id,
              ),
            };
          },
        },
      });
      cache.evict({ id: `Product:${variables?.id}` });
      cache.gc();
    },
  });
}

export function useGenerateCompanyBarcode() {
  return useMutation(GENERATE_COMPANY_BARCODE);
}

// ── Categories ──

export function useCategories() {
  return useQuery(GET_CATEGORIES, { fetchPolicy: 'cache-first' });
}

export function useCategory(id: string) {
  return useQuery(GET_CATEGORY, {
    variables: { id },
    skip: !id,
  });
}

export function useCreateCategory() {
  return useMutation(CREATE_CATEGORY, {
    optimisticResponse({ input }) {
      return {
        createCategory: {
          __typename: 'Category',
          id: `temp-${Date.now()}`,
          name: input.name,
          description: input.description || null,
          isActive: true,
        },
      };
    },
    update(cache, { data }) {
      if (!data?.createCategory) return;
      cache.modify({
        fields: {
          categories(existing = []) {
            const ref = cache.identify(data.createCategory);
            if (!ref) return existing;
            return [...existing, { __ref: ref }];
          },
        },
      });
    },
  });
}

export function useUpdateCategory() {
  return useMutation(UPDATE_CATEGORY);
}

export function useDeleteCategory() {
  return useMutation(DELETE_CATEGORY, {
    update(cache, { data }, { variables }) {
      if (!data?.removeCategory) return;
      cache.modify({
        fields: {
          categories(existing = [], { readField }) {
            return existing.filter(
              (ref: any) => readField('id', ref) !== variables?.id,
            );
          },
        },
      });
      cache.evict({ id: `Category:${variables?.id}` });
      cache.gc();
    },
  });
}

export function useToggleCategoryActive() {
  return useMutation(TOGGLE_CATEGORY_ACTIVE, {
    optimisticResponse({ id, isActive }) {
      return {
        toggleCategoryActive: {
          __typename: 'Category',
          id,
          isActive: !isActive,
        },
      };
    },
  });
}

// ── Suppliers ──

export function useSuppliers(variables?: { includeArchived?: boolean }) {
  return useQuery(GET_SUPPLIERS, {
    variables,
    fetchPolicy: 'cache-first',
  });
}

export function useSupplier(id: string) {
  return useQuery(GET_SUPPLIER, {
    variables: { id },
    skip: !id,
  });
}

export function useCreateSupplier() {
  return useMutation(CREATE_SUPPLIER, {
    optimisticResponse({ input }) {
      return {
        createSupplier: {
          __typename: 'Supplier',
          id: `temp-${Date.now()}`,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          isActive: true,
        },
      };
    },
    update(cache, { data }) {
      if (!data?.createSupplier) return;
      cache.modify({
        fields: {
          suppliers(existing = []) {
            const ref = cache.identify(data.createSupplier);
            if (!ref) return existing;
            return [...existing, { __ref: ref }];
          },
        },
      });
    },
  });
}

export function useUpdateSupplier() {
  return useMutation(UPDATE_SUPPLIER);
}

export function useArchiveSupplier() {
  return useMutation(ARCHIVE_SUPPLIER, {
    optimisticResponse({ id }) {
      return {
        archiveSupplier: { __typename: 'Supplier', id, isActive: false },
      };
    },
  });
}

export function useUnarchiveSupplier() {
  return useMutation(UNARCHIVE_SUPPLIER, {
    optimisticResponse({ id }) {
      return {
        unarchiveSupplier: { __typename: 'Supplier', id, isActive: true },
      };
    },
  });
}

export function useDeleteSupplier() {
  return useMutation(DELETE_SUPPLIER, {
    update(cache, { data }, { variables }) {
      if (!data?.removeSupplier) return;
      cache.modify({
        fields: {
          suppliers(existing = [], { readField }) {
            return existing.filter(
              (ref: any) => readField('id', ref) !== variables?.id,
            );
          },
        },
      });
      cache.evict({ id: `Supplier:${variables?.id}` });
      cache.gc();
    },
  });
}

export function useToggleSupplierActive() {
  return useMutation(TOGGLE_SUPPLIER_ACTIVE, {
    optimisticResponse({ id, isActive }) {
      return {
        toggleSupplierActive: {
          __typename: 'Supplier',
          id,
          isActive: !isActive,
        },
      };
    },
  });
}

// ── Units ──

export function useUnits(variables?: { includeArchived?: boolean }) {
  return useQuery(GET_UNITS, {
    variables,
    fetchPolicy: 'cache-first',
  });
}

export function useUnit(id: string) {
  return useQuery(GET_UNIT, { variables: { id }, skip: !id });
}

export function useCreateUnit() {
  return useMutation(CREATE_UNIT, {
    optimisticResponse({ input }) {
      return {
        createUnit: {
          __typename: 'Unit',
          id: `temp-${Date.now()}`,
          name: input.name,
          shortCode: input.shortCode || '',
          isDefault: false,
          isActive: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    },
    update(cache, { data }) {
      if (!data?.createUnit) return;
      cache.modify({
        fields: {
          units(existing = []) {
            const ref = cache.identify(data.createUnit);
            if (!ref) return existing;
            return [...existing, { __ref: ref }];
          },
        },
      });
    },
  });
}

export function useUpdateUnit() {
  return useMutation(UPDATE_UNIT);
}

export function useDeleteUnit() {
  return useMutation(DELETE_UNIT, {
    update(cache, { data }, { variables }) {
      if (!data?.removeUnit) return;
      cache.modify({
        fields: {
          units(existing = [], { readField }) {
            return existing.filter(
              (ref: any) => readField('id', ref) !== variables?.id,
            );
          },
        },
      });
      cache.evict({ id: `Unit:${variables?.id}` });
      cache.gc();
    },
  });
}

// ── Catalog Stats ──

export function useCatalogStats() {
  return useQuery(GET_CATALOG_STATS, { fetchPolicy: 'cache-and-network' });
}

// ── Barcode ──

export function useProductByBarcode() {
  return useLazyQuery(PRODUCT_BY_BARCODE);
}

export function useProductByBarcodeDetails(options?: LazyQueryHookOptions) {
  return useLazyQuery(PRODUCT_BY_BARCODE_DETAILS, options);
}

export function useBarcodeHistory(productId: string) {
  return useQuery(BARCODE_HISTORY, {
    variables: { productId },
    skip: !productId,
  });
}

export function useProductBarcodeUnits(productId: string) {
  return useQuery(PRODUCT_BARCODE_UNITS, {
    variables: { productId },
    skip: !productId,
  });
}

export function useUpsertProductBarcodeUnit() {
  return useMutation(UPSERT_PRODUCT_BARCODE_UNIT);
}

export function useRemoveProductBarcodeUnit() {
  return useMutation(REMOVE_PRODUCT_BARCODE_UNIT);
}

export function useGenerateBarcodeLabels() {
  return useMutation(GENERATE_BARCODE_LABELS);
}

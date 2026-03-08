import { gql } from "@apollo/client";
import { PRODUCT_LIST_FRAGMENT, PRODUCT_DETAIL_FRAGMENT, PRODUCT_CORE_FRAGMENT } from '../fragments/product.fragment';
import { SUPPLIER_CORE_FRAGMENT, SUPPLIER_LIST_FRAGMENT, CATEGORY_LIST_FRAGMENT, UNIT_LIST_FRAGMENT } from '../fragments/catalog.fragment';

// ============================================
// PRODUCTS
// ============================================

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      ...ProductList
    }
  }
  ${PRODUCT_LIST_FRAGMENT}
`;

export const GET_PRODUCTS_PAGINATED = gql`
  query GetProductsPaginated($pagination: PaginationInput) {
    productsPaginated(pagination: $pagination) {
      items {
        ...ProductList
      }
      pageInfo {
        total
        page
        limit
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${PRODUCT_LIST_FRAGMENT}
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: String!) {
    product(id: $id) {
      ...ProductDetail
    }
  }
  ${PRODUCT_DETAIL_FRAGMENT}
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      ...ProductCore
      category {
        id
        name
      }
      supplier {
        id
        name
      }
    }
  }
  ${PRODUCT_CORE_FRAGMENT}
`;

export const GENERATE_COMPANY_BARCODE = gql`
  mutation GenerateCompanyBarcode {
    generateCompanyBarcode
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      ...ProductCore
    }
  }
  ${PRODUCT_CORE_FRAGMENT}
`;

export const DELETE_PRODUCT = gql`
  mutation RemoveProduct($id: String!) {
    removeProduct(id: $id)
  }
`;

// ============================================
// CATEGORIES
// ============================================

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      ...CategoryList
      products {
        id
      }
    }
  }
  ${CATEGORY_LIST_FRAGMENT}
`;

export const GET_CATEGORY = gql`
  query GetCategory($id: String!) {
    category(id: $id) {
      ...CategoryList
      products {
        id
        name
        sku
      }
    }
  }
  ${CATEGORY_LIST_FRAGMENT}
`;

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      description
      isActive
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($input: UpdateCategoryInput!) {
    updateCategory(input: $input) {
      id
      name
      description
      isActive
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation RemoveCategory($id: String!) {
    removeCategory(id: $id)
  }
`;

// ============================================
// SUPPLIERS
// ============================================

export const GET_SUPPLIERS = gql`
  query GetSuppliers($includeArchived: Boolean) {
    suppliers(includeArchived: $includeArchived) {
      ...SupplierList
    }
  }
  ${SUPPLIER_LIST_FRAGMENT}
`;

export const GET_SUPPLIER = gql`
  query GetSupplier($id: String!) {
    supplier(id: $id) {
      ...SupplierList
      products {
        id
        name
        sku
        unit
      }
    }
  }
  ${SUPPLIER_LIST_FRAGMENT}
`;

export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      ...SupplierCore
    }
  }
  ${SUPPLIER_CORE_FRAGMENT}
`;

export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($input: UpdateSupplierInput!) {
    updateSupplier(input: $input) {
      ...SupplierCore
    }
  }
  ${SUPPLIER_CORE_FRAGMENT}
`;

export const ARCHIVE_SUPPLIER = gql`
  mutation ArchiveSupplier($id: String!) {
    archiveSupplier(id: $id) {
      id
      isActive
    }
  }
`;

export const UNARCHIVE_SUPPLIER = gql`
  mutation UnarchiveSupplier($id: String!) {
    unarchiveSupplier(id: $id) {
      id
      isActive
    }
  }
`;

export const DELETE_SUPPLIER = gql`
  mutation RemoveSupplier($id: String!) {
    removeSupplier(id: $id)
  }
`;

// ============================================
// UNITS
// ============================================

export const GET_UNITS = gql`
  query GetUnits($includeArchived: Boolean = false) {
    units(includeArchived: $includeArchived) {
      ...UnitList
    }
  }
  ${UNIT_LIST_FRAGMENT}
`;

export const GET_UNIT = gql`
  query GetUnit($id: String!) {
    unit(id: $id) {
      id
      name
      shortCode
      isDefault
      created_at
      updated_at
    }
  }
`;

export const CREATE_UNIT = gql`
  mutation CreateUnit($input: CreateUnitInput!) {
    createUnit(input: $input) {
      id
      name
      shortCode
      isDefault
    }
  }
`;

export const UPDATE_UNIT = gql`
  mutation UpdateUnit($input: UpdateUnitInput!) {
    updateUnit(input: $input) {
      id
      name
      shortCode
      isDefault
      isActive
    }
  }
`;

export const DELETE_UNIT = gql`
  mutation RemoveUnit($id: String!) {
    removeUnit(id: $id)
  }
`;

// ============================================
// CATALOG STATS (for dashboard)
// ============================================

export const GET_CATALOG_STATS = gql`
  query GetCatalogStats {
    products {
      id
      is_active
    }
    categories {
      id
      isActive
    }
    suppliers {
      id
      isActive
    }
    units {
      id
    }
  }
`;

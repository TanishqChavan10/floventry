import { gql } from "@apollo/client";

// ============================================
// PRODUCTS
// ============================================

export const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      sku
      barcode
      unit
      cost_price
      selling_price
      image_url
      is_active
      category {
        id
        name
      }
      supplier {
        id
        name
      }
      created_at
      updated_at
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: String!) {
    product(id: $id) {
      id
      name
      sku
      barcode
      unit
      cost_price
      selling_price
      image_url
      description
      is_active
      category {
        id
        name
        description
      }
      supplier {
        id
        name
        email
        phone
        address
      }
      created_at
      updated_at
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      sku
      unit
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
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      sku
      unit
      cost_price
      selling_price
      image_url
      is_active
    }
  }
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
      id
      name
      description
      isActive
      created_at
      updated_at
    }
  }
`;

export const GET_CATEGORY = gql`
  query GetCategory($id: String!) {
    category(id: $id) {
      id
      name
      description
      isActive
      products {
        id
        name
        sku
      }
      created_at
      updated_at
    }
  }
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
  query GetSuppliers {
    suppliers {
      id
      name
      email
      phone
      address
      isActive
      created_at
      updated_at
    }
  }
`;

export const GET_SUPPLIER = gql`
  query GetSupplier($id: String!) {
    supplier(id: $id) {
      id
      name
      email
      phone
      address
      isActive
      created_at
      updated_at
    }
  }
`;

export const CREATE_SUPPLIER = gql`
  mutation CreateSupplier($input: CreateSupplierInput!) {
    createSupplier(input: $input) {
      id
      name
      email
      phone
      address
      isActive
    }
  }
`;

export const UPDATE_SUPPLIER = gql`
  mutation UpdateSupplier($input: UpdateSupplierInput!) {
    updateSupplier(input: $input) {
      id
      name
      email
      phone
      address
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
  query GetUnits {
    units {
      id
      name
      shortCode
      isDefault
      created_at
      updated_at
    }
  }
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
    }
    categories {
      id
    }
    suppliers {
      id
    }
  }
`;

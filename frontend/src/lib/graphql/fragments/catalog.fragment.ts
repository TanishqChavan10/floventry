import { gql } from '@apollo/client';

/** Supplier core fields used in lists */
export const SUPPLIER_CORE_FRAGMENT = gql`
  fragment SupplierCore on Supplier {
    id
    name
    email
    phone
    address
    isActive
  }
`;

/** Supplier list item with metadata */
export const SUPPLIER_LIST_FRAGMENT = gql`
  fragment SupplierList on Supplier {
    ...SupplierCore
    productsCount
    created_at
    updated_at
  }
  ${SUPPLIER_CORE_FRAGMENT}
`;

/** Category fields used in lists */
export const CATEGORY_LIST_FRAGMENT = gql`
  fragment CategoryList on Category {
    id
    name
    description
    isActive
    created_at
    updated_at
  }
`;

/** Unit fields used in lists */
export const UNIT_LIST_FRAGMENT = gql`
  fragment UnitList on Unit {
    id
    name
    shortCode
    isDefault
    isActive
    created_at
    updated_at
  }
`;

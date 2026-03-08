import { gql } from '@apollo/client';

/** Minimal warehouse ref used inside nested objects (stock, PO, GRN, etc.) */
export const WAREHOUSE_REF_FRAGMENT = gql`
  fragment WarehouseRef on Warehouse {
    id
    name
  }
`;

/** Warehouse ref with slug — used in transfer/PO lists */
export const WAREHOUSE_SLUG_FRAGMENT = gql`
  fragment WarehouseSlug on Warehouse {
    id
    name
    slug
  }
`;

/** Warehouse list item — used in warehouse lists */
export const WAREHOUSE_LIST_FRAGMENT = gql`
  fragment WarehouseList on Warehouse {
    id
    name
    slug
    address
    type
    code
    timezone
    status
    created_at
  }
`;

/** Full warehouse detail — used in settings pages */
export const WAREHOUSE_DETAIL_FRAGMENT = gql`
  fragment WarehouseDetail on Warehouse {
    id
    name
    slug
    description
    type
    code
    timezone
    address
    city
    state
    country
    contact_person
    contact_phone
    status
    is_default
  }
`;

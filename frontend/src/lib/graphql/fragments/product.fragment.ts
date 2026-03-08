import { gql } from '@apollo/client';

/** Core product fields used in lists (catalog, stock views, PO items, etc.) */
export const PRODUCT_CORE_FRAGMENT = gql`
  fragment ProductCore on Product {
    id
    name
    sku
    barcode
    alternate_barcodes
    unit
    cost_price
    selling_price
    image_url
    is_active
  }
`;

/** Product list fields — core plus category/supplier refs and timestamps */
export const PRODUCT_LIST_FRAGMENT = gql`
  fragment ProductList on Product {
    ...ProductCore
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
  ${PRODUCT_CORE_FRAGMENT}
`;

/** Full product detail with expanded relations */
export const PRODUCT_DETAIL_FRAGMENT = gql`
  fragment ProductDetail on Product {
    ...ProductCore
    description
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
  ${PRODUCT_CORE_FRAGMENT}
`;

import { gql } from '@apollo/client';
import { WAREHOUSE_REF_FRAGMENT, WAREHOUSE_SLUG_FRAGMENT } from './warehouse.fragment';

/** Purchase order list item */
export const PURCHASE_ORDER_LIST_FRAGMENT = gql`
  fragment PurchaseOrderList on PurchaseOrder {
    id
    po_number
    status
    notes
    warehouse {
      ...WarehouseSlug
    }
    supplier {
      id
      name
    }
    user {
      id
      fullName
    }
    items {
      id
      ordered_quantity
      received_quantity
      product {
        id
        name
        sku
      }
    }
    created_at
    updated_at
  }
  ${WAREHOUSE_SLUG_FRAGMENT}
`;

/** Purchase order detail (expands on list with extra sub-fields) */
export const PURCHASE_ORDER_DETAIL_FRAGMENT = gql`
  fragment PurchaseOrderDetail on PurchaseOrder {
    id
    po_number
    status
    notes
    warehouse {
      ...WarehouseSlug
      type
    }
    supplier {
      id
      name
      email
      phone
    }
    user {
      id
      fullName
    }
    user_role
    items {
      id
      ordered_quantity
      received_quantity
      product {
        id
        name
        sku
        unit
      }
      created_at
    }
    created_at
    updated_at
  }
  ${WAREHOUSE_SLUG_FRAGMENT}
`;

/** GRN list item */
export const GRN_LIST_FRAGMENT = gql`
  fragment GRNList on GoodsReceiptNote {
    id
    grn_number
    status
    received_at
    notes
    warehouse {
      ...WarehouseRef
    }
    purchase_order {
      id
      po_number
      supplier {
        id
        name
      }
    }
    user {
      id
      fullName
    }
    user_role
    posted_by_user {
      id
      fullName
    }
    posted_at
    created_at
    updated_at
  }
  ${WAREHOUSE_REF_FRAGMENT}
`;

/** Transfer list item */
export const TRANSFER_LIST_FRAGMENT = gql`
  fragment TransferList on WarehouseTransfer {
    id
    transfer_number
    status
    source_warehouse {
      ...WarehouseSlug
    }
    destination_warehouse {
      ...WarehouseSlug
    }
    items {
      id
      product {
        id
        name
        sku
      }
      quantity
    }
    notes
    user {
      id
      fullName
    }
    user_role
    created_at
    updated_at
  }
  ${WAREHOUSE_SLUG_FRAGMENT}
`;

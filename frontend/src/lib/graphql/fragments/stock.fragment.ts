import { gql } from '@apollo/client';
import { WAREHOUSE_REF_FRAGMENT } from './warehouse.fragment';

/** Stock record with product details — used in warehouse stock views */
export const STOCK_WITH_PRODUCT_FRAGMENT = gql`
  fragment StockWithProduct on Stock {
    id
    product {
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
      cost_price
      selling_price
    }
    warehouse {
      ...WarehouseRef
    }
    quantity
    min_stock_level
    max_stock_level
    reorder_point
    created_at
    updated_at
  }
  ${WAREHOUSE_REF_FRAGMENT}
`;

/** Stock record with lots — extends StockWithProduct with lot details */
export const STOCK_WITH_LOTS_FRAGMENT = gql`
  fragment StockWithLots on Stock {
    id
    product {
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
      cost_price
      selling_price
    }
    warehouse {
      ...WarehouseRef
    }
    quantity
    min_stock_level
    max_stock_level
    reorder_point
    lots {
      id
      quantity
      expiry_date
      received_at
      source_type
    }
    created_at
    updated_at
  }
  ${WAREHOUSE_REF_FRAGMENT}
`;

/** Minimal stock fields returned by mutations */
export const STOCK_CORE_FRAGMENT = gql`
  fragment StockCore on Stock {
    id
    quantity
    min_stock_level
    max_stock_level
    reorder_point
  }
`;

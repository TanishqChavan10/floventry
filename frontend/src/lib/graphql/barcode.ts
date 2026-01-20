import { gql } from '@apollo/client';

export const PRODUCT_BY_BARCODE = gql`
  query ProductByBarcode($barcode: String!) {
    productByBarcode(barcode: $barcode) {
      id
      name
      sku
      unit
      is_active
    }
  }
`;

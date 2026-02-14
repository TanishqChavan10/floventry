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

export const PRODUCT_BY_BARCODE_DETAILS = gql`
  query ProductByBarcodeDetails($barcode: String!) {
    productByBarcodeDetails(barcode: $barcode) {
      barcode_value
      unit_type
      quantity_multiplier
      product {
        id
        name
        sku
        unit
        is_active
      }
    }
  }
`;

export const BARCODE_HISTORY = gql`
  query BarcodeHistory($productId: String!) {
    barcodeHistory(productId: $productId) {
      id
      change_type
      old_value
      new_value
      reason
      changed_by_user_id
      changed_at
    }
  }
`;

export const PRODUCT_BARCODE_UNITS = gql`
  query ProductBarcodeUnits($productId: String!) {
    productBarcodeUnits(productId: $productId) {
      id
      product_id
      barcode_value
      unit_type
      quantity_multiplier
      is_primary
      created_at
    }
  }
`;

export const UPSERT_PRODUCT_BARCODE_UNIT = gql`
  mutation UpsertProductBarcodeUnit($input: UpsertProductBarcodeUnitInput!) {
    upsertProductBarcodeUnit(input: $input) {
      id
      product_id
      barcode_value
      unit_type
      quantity_multiplier
      is_primary
      created_at
    }
  }
`;

export const REMOVE_PRODUCT_BARCODE_UNIT = gql`
  mutation RemoveProductBarcodeUnit($id: String!) {
    removeProductBarcodeUnit(id: $id)
  }
`;

export const GENERATE_BARCODE_LABELS = gql`
  mutation GenerateBarcodeLabels($input: GenerateBarcodeLabelsInput!) {
    generateBarcodeLabels(input: $input) {
      pdfData
      filename
      mimeType
    }
  }
`;

export type BarcodeLabelLayout = 'A4_SINGLE' | 'A4_2X4' | 'A4_3X8' | 'THERMAL_50X25';

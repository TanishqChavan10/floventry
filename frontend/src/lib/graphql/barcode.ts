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

export const GENERATE_BARCODE_LABELS = gql`
  mutation GenerateBarcodeLabels($input: GenerateBarcodeLabelsInput!) {
    generateBarcodeLabels(input: $input) {
      pdfData
      filename
      mimeType
    }
  }
`;

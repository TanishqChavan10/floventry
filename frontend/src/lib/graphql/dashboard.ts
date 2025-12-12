import { gql } from "@apollo/client";

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($supplierStatus: String, $shipmentLimit: Int, $expiringDays: Int) {
    products {
      product_id
      stock
      default_price
    }
    lowStockProducts: products(filter: { min_stock_alert: true }) {
      product_id
      name
    }
    suppliers(status: $supplierStatus) {
      supplier_id
    }
    shipments(limit: $shipmentLimit) {
      shipment_id
      received_date
    }
    expiringShipmentItems(expiringInDays: $expiringDays) {
      shipment_item_id
    }
  }
`;

export interface DashboardStats {
    products: Array<{
        stock: number;
        default_price: number;
    }>;
    lowStockProducts: Array<{}>;
    suppliers: Array<{}>;
    shipments: Array<{
        shipment_id: string;
        received_date: string;
    }>;
    expiringShipmentItems: Array<{}>;
}

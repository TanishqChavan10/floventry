import { gql } from '@apollo/client';

export const GET_COMPANY_DASHBOARD = gql`
  query GetCompanyDashboard {
    companyDashboard {
      kpis {
        totalSkus: total_skus
        warehouses
        totalStockUnits: total_stock_units
        stockAtRisk: stock_at_risk
        expiredStockUnits: expired_stock_units
        movements7d: movements_7d {
          inUnits: in_units
          outUnits: out_units
        }
        movements30d: movements_30d {
          inUnits: in_units
          outUnits: out_units
        }
      }
      stockStatusDistribution: stock_status_distribution {
        ok
        low
        critical
      }
      expiryRiskDistribution: expiry_risk_distribution {
        ok
        expiringSoon: expiring_soon
        expired
      }
      warehouseHealthSnapshot: warehouse_health_snapshot {
        warehouseId: warehouse_id
        warehouseName: warehouse_name
        warehouseSlug: warehouse_slug
        okPercent: ok_percent
        riskBadge: risk_badge
      }
      recentActivity: recent_activity {
        eventType: event_type
        referenceNumber: reference_number
        warehouseName: warehouse_name
        performedBy: performed_by
        occurredAt: occurred_at
      }
      activeAlertsSummary: active_alerts_summary {
        critical
        warning
        lowStock: low_stock
        expiry
        importIssues: import_issues
      }
    }
  }
`;

export interface CompanyDashboardQueryResult {
  companyDashboard: CompanyDashboardData;
}

export interface CompanyDashboardData {
  kpis: {
    totalSkus: number;
    warehouses: number;
    totalStockUnits: number;
    stockAtRisk: number;
    expiredStockUnits: number;
    movements7d: { inUnits: number; outUnits: number };
    movements30d: { inUnits: number; outUnits: number };
  };
  stockStatusDistribution: {
    ok: number;
    low: number;
    critical: number;
  };
  expiryRiskDistribution: {
    ok: number;
    expiringSoon: number;
    expired: number;
  };
  warehouseHealthSnapshot: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseSlug?: string | null;
    okPercent: number;
    riskBadge: string;
  }>;
  recentActivity: Array<{
    eventType: string;
    referenceNumber?: string | null;
    warehouseName?: string | null;
    performedBy?: string | null;
    occurredAt: string;
  }>;
  activeAlertsSummary: {
    critical: number;
    warning: number;
    lowStock: number;
    expiry: number;
    importIssues: number;
  };
}

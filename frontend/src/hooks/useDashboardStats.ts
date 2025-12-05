import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS, DashboardStats } from '@/lib/graphql/dashboard';
import { formatIndianRupee } from '@/lib/formatters';
import { StatData } from '@/data/dashboardData';

interface UseDashboardStatsReturn {
  stats: StatData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardStats = (): UseDashboardStatsReturn => {
  const [error, setError] = useState<string | null>(null);

  const { data, loading, error: queryError, refetch } = useQuery(GET_DASHBOARD_STATS, {
    variables: {
      supplierStatus: 'Active',
      shipmentLimit: 100, // Get recent shipments to filter by date
      expiringDays: 30
    },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all'
  });

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    } else {
      setError(null);
    }
  }, [queryError]);

  // Process the data and calculate stats
  const totalInventoryValue = data?.products
    ? data.products.reduce((total: number, product: DashboardStats['products'][0]) => total + (product.stock * product.default_price), 0)
    : 0;  const processedStats: StatData[] = data ? [
    {
      title: "Total Products",
      value: data.products?.length || 0,
      icon: "box",
      change: "+2.5%",
      description: "Total inventory items",
      details: {
        title: "Product Inventory",
        columns: ["Product ID", "Status", "Count"],
        data: [
          ["Active Products", "In Stock", data.products?.length.toString() || "0"],
          ["Categories", "Various", "Multiple"],
          ["Status", "Active", "Monitored"]
        ]
      }
    },
    {
      title: "Low Stock Alerts",
      value: data.lowStockProducts?.length || 0,
      icon: "alert-triangle",
      description: "Items need restocking",
      details: {
        title: "Products Below Minimum Stock",
        columns: ["Alert Type", "Count", "Priority"],
        data: [
          ["Low Stock", data.lowStockProducts?.length.toString() || "0", "High"],
          ["Critical", "Pending", "Critical"],
          ["Action Required", "Immediate", "High"]
        ]
      }
    },
    {
      title: "Total Inventory Value",
      value: formatIndianRupee(totalInventoryValue),
      icon: "rupee-indian",
      change: "+8.2%",
      description: "Current stock value",
      details: {
        title: "Inventory Valuation",
        columns: ["Category", "Value", "Percentage"],
        data: [
          ["Total Value", formatIndianRupee(totalInventoryValue), "100%"],
          ["Active Stock", "Calculated", "Live"],
          ["Market Value", "Current", "Updated"]
        ]
      }
    },
    {
      title: "Active Suppliers",
      value: data.suppliers?.length || 0,
      icon: "users",
      description: "Verified suppliers",
      details: {
        title: "Supplier Directory",
        columns: ["Status", "Count", "Type"],
        data: [
          ["Active Suppliers", data.suppliers?.length.toString() || "0", "Verified"],
          ["Partnership", "Active", "Ongoing"],
          ["Verification", "Complete", "Approved"]
        ]
      }
    },
    {
      title: "Recent Shipments",
      value: filterRecentShipments(data.shipments || []),
      icon: "activity",
      description: "Last 24 hours",
      details: {
        title: "Recent Activity",
        columns: ["Activity", "Count", "Timeframe"],
        data: [
          ["Recent Shipments", filterRecentShipments(data.shipments || []).toString(), "24h"],
          ["Processing", "Active", "Ongoing"],
          ["Status", "Updated", "Real-time"]
        ]
      }
    },
    {
      title: "Expiring Soon",
      value: data.expiringShipmentItems?.length || 0,
      icon: "clock",
      description: "Next 30 days",
      details: {
        title: "Expiring Items",
        columns: ["Category", "Count", "Days Left"],
        data: [
          ["Expiring Items", data.expiringShipmentItems?.length.toString() || "0", "≤30 days"],
          ["Monitoring", "Active", "Daily"],
          ["Alert Level", "Standard", "Scheduled"]
        ]
      }
    }
  ] : [];

  return {
    stats: processedStats,
    loading,
    error,
    refetch: () => {
      setError(null);
      refetch();
    }
  };
};

// Helper function to filter shipments from last 24 hours
const filterRecentShipments = (shipments: Array<{ shipment_id: string; received_date: string }>): number => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return shipments.filter(shipment => {
    if (!shipment.received_date) return false;
    const receivedDate = new Date(shipment.received_date);
    return receivedDate >= yesterday;
  }).length;
};
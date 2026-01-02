
// Dashboard data based on ER Diagram entities
import { formatIndianRupee } from '@/lib/formatters';

// Types
export interface StatDetails {
  title: string;
  columns: string[];
  data: (string | number)[][];
}

export interface StatData {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  description?: string;
  details: StatDetails;
}

export interface ActivityItem {
  type: "sale" | "restock" | "alert" | "shipment";
  message: string;
  time: string;
  badge: string;
}

export interface LowStockItem {
  name: string;
  category: string;
  stock: number;
  total: number;
  daysLeft: number;
}

// Inventory page specific stats
export interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStock: number;
  totalValue: string;
}

export const inventoryStats: InventoryStats = {
  totalProducts: 8,
  lowStockItems: 3,
  outOfStock: 0,
  totalValue: formatIndianRupee(42420.6)
};

// Mock inventory data that matches the screenshot for display purposes
export const mockInventoryData = [
  { id: "1", name: "Laptop Computer", category: "Electronics", price: 999.99, stock: 25, minStock: 10, status: "In Stock" },
  { id: "2", name: "Wireless Mouse", category: "Electronics", price: 29.99, stock: 5, minStock: 20, status: "Low Stock" },
  { id: "3", name: "Office Chair", category: "Office Supplies", price: 199.99, stock: 45, minStock: 15, status: "In Stock" },
  { id: "4", name: "Coffee Beans 1kg", category: "Food & Beverages", price: 24.99, stock: 8, minStock: 30, status: "Low Stock" },
  { id: "5", name: "Printer Paper A4", category: "Office Supplies", price: 12.99, stock: 12, minStock: 50, status: "Low Stock" },
  { id: "6", name: "Desk Lamp", category: "Electronics", price: 49.99, stock: 75, minStock: 20, status: "In Stock" },
  { id: "7", name: "Water Bottle", category: "Home & Garden", price: 15.99, stock: 120, minStock: 30, status: "In Stock" },
  { id: "8", name: "Notebook Set", category: "Office Supplies", price: 8.99, stock: 250, minStock: 50, status: "In Stock" }
];

// Dashboard stats following ER diagram structure
export const statsData: StatData[] = [
  {
    title: "Total Products",
    value: 1247,
    icon: "box",
    change: "+12%",
    description: "from last month",
    details: {
      title: "Product Inventory",
      columns: ["product_ID", "name", "default_price", "category_id"],
      data: [
        ["1", "Sunflower Oil", "120.00", "1"],
        ["2", "Toothpaste", "8.50", "2"],
        ["3", "Bread - Whole Wheat", "3.50", "1"],
        ["4", "Bottled Water", "48.00", "3"],
        ["5", "Shampoo", "15.00", "2"]
      ]
    }
  },
  {
    title: "Low Stock Alerts",
    value: 23,
    icon: "alert-triangle",
    description: "Items need restocking",
    details: {
      title: "Products Below Minimum Stock",
      columns: ["product_ID", "name", "current_quantity", "min_required"],
      data: [
        ["2", "Toothpaste", "6", "20"],
        ["3", "Bread - Whole Wheat", "4", "15"],
        ["6", "Milk", "8", "25"],
        ["7", "Organic Honey", "2", "10"]
      ]
    }
  },
  {
    title: "Total Revenue",
    value: formatIndianRupee(45678.90),
    icon: "rupee-indian",
    change: "+8.2%",
    description: "from last month",
    details: {
      title: "Sales Revenue",
      columns: ["transaction_id", "transaction_date", "total_amt", "payment_method"],
      data: [
        ["1001", "2025-09-15", "1800.00", "Credit Card"],
        ["1002", "2025-09-15", "450.50", "Cash"],
        ["1003", "2025-09-14", "320.75", "Debit Card"],
        ["1004", "2025-09-14", "180.25", "Credit Card"]
      ]
    }
  },
  {
    title: "Active Suppliers",
    value: 15,
    icon: "users",
    description: "Verified suppliers",
    details: {
      title: "Supplier Directory",
      columns: ["supplier_id", "name", "email", "phone_no"],
      data: [
        ["1", "FreshFarms Pvt Ltd", "contact@freshfarms.com", "+91-9876543210"],
        ["2", "GlowCare Essentials", "sales@glowcare.com", "+91-9876543211"],
        ["3", "BakeSmart Foods", "orders@bakesmart.com", "+91-9876543212"],
        ["4", "HydroPure Ltd", "info@hydropure.com", "+91-9876543213"]
      ]
    }
  },
  {
    title: "Recent Transactions",
    value: 156,
    icon: "activity",
    description: "Last 24 hours",
    details: {
      title: "Recent Sales",
      columns: ["transaction_id", "customer_id", "cashier_id", "transaction_date", "total_amt"],
      data: [
        ["1001", "501", "101", "2025-09-15 14:30:00", "1800.00"],
        ["1002", "502", "101", "2025-09-15 15:45:00", "450.50"],
        ["1003", "503", "102", "2025-09-15 16:20:00", "320.75"],
        ["1004", "501", "101", "2025-09-15 17:10:00", "180.25"]
      ]
    }
  },
  {
    title: "Expired Products",
    value: 8,
    icon: "x-circle",
    description: "Items past expiry date",
    details: {
      title: "Expired Inventory",
      columns: ["product_ID", "name", "expiry_date", "quantity", "batch_no"],
      data: [
        ["6", "Milk", "2025-09-10", "5", "BATCH001"],
        ["7", "Yogurt", "2025-09-12", "3", "BATCH002"],
        ["8", "Fresh Bread", "2025-09-14", "2", "BATCH003"],
        ["9", "Cheese", "2025-09-11", "1", "BATCH004"]
      ]
    }
  }
];

// Recent activity with proper entity references
export const recentActivity: ActivityItem[] = [
  {
    type: "sale",
    message: "Laptop Computer sold",
    time: "2 hours ago",
    badge: formatIndianRupee(999.99)
  },
  {
    type: "restock",
    message: "Office Chairs restocked",
    time: "4 hours ago",
    badge: "+25 items"
  },
  {
    type: "alert",
    message: "Wireless Mouse low stock",
    time: "6 hours ago",
    badge: "5 left"
  },
  {
    type: "shipment",
    message: "New shipment from TechCorp",
    time: "1 day ago",
    badge: "45 items"
  },
  {
    type: "alert",
    message: "Wireless Mouse low stock",
    time: "6 hours ago",
    badge: "5 left"
  },
  {
    type: "shipment",
    message: "New shipment from TechCorp",
    time: "1 day ago",
    badge: "45 items"
  }
];

// Low stock items matching ER diagram
export const lowStockItems: LowStockItem[] = [
  {
    name: "Wireless Mouse",
    category: "Electronics",
    stock: 5,
    total: 20,
    daysLeft: 3
  },
  {
    name: "Printer Paper A4",
    category: "Office Supplies",
    stock: 12,
    total: 50,
    daysLeft: 7
  },
  {
    name: "Coffee Beans 1kg",
    category: "Food & Beverages",
    stock: 8,
    total: 30,
    daysLeft: 5
  }
];

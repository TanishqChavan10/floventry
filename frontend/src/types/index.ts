import { formatIndianRupee } from '@/lib/formatters';

// Centralized type definitions for better TypeScript performance

// Enhanced Category types
export type Category = {
  category_id: number;
  name: string;
  products?: Product[];
};

// Create Category Input
export type CreateCategoryInput = {
  name: string;
};

// Update Category Input
export type UpdateCategoryInput = {
  category_id: number;
  name?: string;
};

// Backend Product type that matches the GraphQL schema
export type Product = {
  product_id: number;
  product_name: string;
  default_price: number;
  stock: number;
  min_stock: number;
  categories?: Category[];
};

// Create Product Input
export type CreateProductInput = {
  product_name: string;
  default_price: number;
  stock: number;
  min_stock: number;
  categoryIds?: number[];
};

// Update Product Input
export type UpdateProductInput = {
  product_id: number;
  product_name?: string;
  default_price?: number;
  stock?: number;
  min_stock?: number;
  categoryIds?: number[];
};

// Product Category types
export type ProductCategory = {
  product_id: number;
  category_id: number;
};

export type CreateProductCategoryInput = {
  product_id: number;
  category_id: number;
};

export type RemoveProductCategoryInput = {
  product_id: number;
  category_id: number;
};

// Legacy product type for backward compatibility
export type LegacyProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  minCount: number;
};

// Function to convert Product to LegacyProduct for compatibility
export function mapProductToLegacy(product: Product): LegacyProduct {
  const primaryCategory = product.categories && product.categories.length > 0 
    ? product.categories[0].name 
    : 'Uncategorized';
    
  return {
    id: product.product_id.toString(),
    name: product.product_name,
    category: primaryCategory,
    quantity: product.stock,
    price: product.default_price,
    minCount: product.min_stock,
  };
}

// Enhanced Supplier types based on ER diagram
export type Supplier = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  products: string[];
  orders: number;
  totalValue: string;
  lastOrder: string;
  status: 'Active' | 'Inactive';
  category_id?: number;
  category?: Category;
};

export type SupplierDetail = {
  supplier_id: string;
  name: string;
  email: string;
  phone_no: string;
  address?: string;
  contact_person?: string;
  registration_number?: string;
  tax_id?: string;
  created_date: string;
  status: 'Active' | 'Inactive';
  category_id: number;
  category?: Category;
};

// Create Supplier Input
export type CreateSupplierInput = {
  name: string;
  email: string;
  phone_no: string;
  address?: string;
  contact_person?: string;
  registration_number?: string;
  tax_id?: string;
  status?: 'Active' | 'Inactive';
  category_id: number;
};

// Enhanced Shipment types
export type CreateShipmentInput = {
  supplier_id: string;
  ref_no: string;
  received_date?: Date;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_mthd: string;
  invoice_amt: number;
  total_items: number;
  items: ShipmentItemInput[];
};

export type ShipmentItemInput = {
  product_id: string;
  product_name: string;
  quantity_received: number;
  unit_price: number;
  batch_number?: string;
};

export type Shipment = {
  shipment_id: string;
  supplier_id: string;
  ref_no: string;
  received_date: string;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_mthd: string;
  invoice_amt: number;
  total_items: number;
};

export type ShipmentItem = {
  shipment_id: string;
  product_id: string;
  product_name: string;
  quantity_received: number;
  unit_price: number;
  mfg_date?: string;
  expiry_date?: string;
  batch_number?: string;
};

// Enhanced Transaction types based on ER diagram
export type TransactionDetail = {
  transaction_id: string;
  customer_id?: string;
  cashier_id: string;
  transaction_date: string;
  payment_method: 'Cash' | 'Credit Card' | 'Debit Card' | 'Mobile Payment';
  total_amt: number;
  payment_refno?: string;
  status: 'Completed' | 'Pending' | 'Failed';
  tax_amount?: number;
  discount_amount?: number;
  subtotal: number;
  notes?: string;
};

export type Customer = {
  customer_id: string;
  name: string;
  phone_number?: string;
  created_date: string;
};

export type OrderItem = {
  transaction_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  category_name?: string;
};

export type Employee = {
  employee_id: string;
  name: string;
  role: string;
  contact?: string;
  department?: string;
  hire_date?: string;
};

export type SupplierMetrics = {
  supplier_id: string;
  supplier_name: string;
  total_shipments: number;
  on_time_delivery: number;
  total_value: number;
  avg_payment_time: number;
  quality_score: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Poor';
};

export type EmployeeMetrics = {
  employee_id: string;
  employee_name: string;
  transactions_handled: number;
  total_sales: number;
  avg_transaction_value: number;
  customer_rating: number;
  efficiency_score: number;
};

// Common props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface InventoryHeaderProps {
  onAddProduct: () => void;
}

// Supplier component props
export interface SuppliersHeaderProps {
  onAddSupplier?: () => void;
}

export interface SuppliersSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface SupplierRowProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export interface SuppliersTableProps {
  suppliers: Supplier[];
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  fetchingSupplierForEdit?: boolean;
}

// Enhanced Supplier detail page props
export interface SupplierDetailHeaderProps {
  supplier: SupplierDetail;
  onCreateShipment?: () => void;
  onRefresh?: () => void;
}

export interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierDetail;
  onShipmentCreated?: () => void;
}

export interface ShipmentItemsTableProps {
  shipment: Shipment;
  items: ShipmentItem[];
}

export interface SupplierStatsProps {
  totalShipments: number;
  totalValue: number;
  totalProducts: number;
  avgOrderValue: number;
  lastOrderDate: string;
}

export interface SupplierShipmentsProps {
  shipments: Shipment[];
  onViewShipment?: (shipment: Shipment) => void;
}

// Transaction component props
export interface TransactionDetailHeaderProps {
  transaction: TransactionDetail;
  customer?: Customer;
  cashier: Employee;
}

export interface TransactionStatsProps {
  transaction: TransactionDetail;
  totalItems: number;
  uniqueProducts: number;
}

export interface TransactionItemsProps {
  orderItems: OrderItem[];
}

export interface TransactionPaymentProps {
  transaction: TransactionDetail;
}

// Reports and Analytics types
export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export interface InventoryInsightsProps {
  alerts: Array<{
    type: 'low_stock' | 'expiring_soon' | 'expired' | 'overstock';
    product_id: string;
    product_name: string;
    current_stock: number;
    threshold: number;
    days_until_expiry?: number;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export interface SupplierPerformanceProps {
  suppliers: SupplierMetrics[];
}

export interface FinancialOverviewProps {
  metrics: Array<{
    period: string;
    revenue: number;
    costs: number;
    profit: number;
    profit_margin: number;
    tax_collected: number;
  }>;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// GraphQL API Response Types
export type SupplierGraphQL = {
  supplier_id: string;
  name: string;
  email: string;
  phone_no: string;
  address?: string;
  contact_person?: string;
  registration_number?: string;
  tax_id?: string;
  status: 'Active' | 'Inactive';
  created_date: string;
  updated_date: string;
  category_id?: number; // Made optional to match reality
};

export type ShipmentGraphQL = {
  shipment_id: string;
  supplier_id: string;
  ref_no: string;
  received_date: string;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_mthd: string;
  invoice_amt: number;
  total_items: number;
};

export type ShipmentItemGraphQL = {
  id: string;
  shipment_id: string;
  product_id: string;
  product_name: string;
  quantity_received: number;
  unit_price: number;
  mfg_date?: string;
  expiry_date?: string;
  batch_number?: string;
};

// Transformation functions
export function transformSupplierForTable(
  supplier: SupplierGraphQL,
  shipments: ShipmentGraphQL[] = [],
  shipmentItems: ShipmentItemGraphQL[] = []
): Supplier {
  const totalValue = shipments.reduce((sum, shipment) => sum + shipment.invoice_amt, 0);
  const lastOrder = shipments.length > 0 
    ? [...shipments].sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())[0].received_date
    : supplier.created_date;

  return {
    id: supplier.supplier_id,
    name: supplier.name,
    contact: supplier.contact_person || supplier.email,
    email: supplier.email,
    phone: supplier.phone_no,
    products: [], // Empty array since products column was removed
    orders: shipments.length,
    totalValue: formatIndianRupee(totalValue),
    lastOrder: new Date(lastOrder).toLocaleDateString(),
    status: supplier.status,
  };
}

export function transformSupplierDetail(supplier: SupplierGraphQL): SupplierDetail {
  return {
    supplier_id: supplier.supplier_id,
    name: supplier.name,
    email: supplier.email,
    phone_no: supplier.phone_no,
    address: supplier.address,
    contact_person: supplier.contact_person,
    registration_number: supplier.registration_number,
    tax_id: supplier.tax_id,
    created_date: supplier.created_date,
    status: supplier.status,
    category_id: supplier.category_id || 1, // Provide fallback value
  };
}

export function transformShipment(shipment: ShipmentGraphQL): Shipment {
  return {
    shipment_id: shipment.shipment_id,
    supplier_id: shipment.supplier_id,
    ref_no: shipment.ref_no,
    received_date: shipment.received_date,
    payment_status: shipment.payment_status,
    payment_mthd: shipment.payment_mthd,
    invoice_amt: shipment.invoice_amt,
    total_items: shipment.total_items,
  };
}

export function transformShipmentItem(item: ShipmentItemGraphQL): ShipmentItem {
  return {
    shipment_id: item.shipment_id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity_received: item.quantity_received,
    unit_price: item.unit_price,
    mfg_date: item.mfg_date,
    expiry_date: item.expiry_date,
    batch_number: item.batch_number,
  };
}
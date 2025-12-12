export type OrderItem = {
  transaction_id: string;
  product_id: string | number;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  discount_applied?: number;
  category_name?: string;
};

export type Transaction = {
  id: string;
  date: string;
  customer: string;
  total_amt: number;
  payment_method: string;
  status: string;
  items: OrderItem[];
  employee_id: string;
  payment_refno?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
};

export type TransactionItemsProps = {
  orderItems: OrderItem[];
};

export type TransactionStatsProps = {
  transaction: Transaction;
  totalItems: number;
  uniqueProducts: number;
};

// Transaction form types
export type TransactionItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  available_stock: number;
};

export type CreateTransactionInput = {
  transaction_id: string;
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
  employee_id: string;
  payment_refno?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amt: number;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    discount: number;
  }[];
  new_customer?: {
    name: string;
    phone_no?: string;
  };
};
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Minus,
  X,
  ShoppingCart,
  User,
  CreditCard,
  Receipt,
  Calculator,
  Loader2,
} from 'lucide-react';
import { formatIndianRupee } from '@/lib/formatters';
import type { Product } from '@/types';
import { useEmployees } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';
import type { TransactionItem } from '@/types/transaction';

// Define Employee type if not imported from types
interface Employee {
  employee_id: string;
  name: string;
}

interface NewTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: any) => void;
  loading?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash Payment', icon: '💵' },
  { value: 'Credit Card', label: 'Credit Card', icon: '💳' },
  { value: 'Debit Card', label: 'Debit Card', icon: '💳' },
  { value: 'Mobile Payment', label: 'Mobile Payment', icon: '📱' },
];

// Generate a payment reference number based on the payment method
const generatePaymentReference = (method: string): string => {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-8); // Last 8 digits of timestamp
  const date = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  switch (method) {
    case 'Cash':
      return `CASH-${date}-${timestamp}`;
    case 'Credit Card':
      return `CC-${date}-${timestamp}`;
    case 'Debit Card':
      return `DC-${date}-${timestamp}`;
    case 'Mobile Payment':
      return `UPI-${date}-${timestamp}`;
    default:
      return `PAY-${date}-${timestamp}`;
  }
};

export function NewTransactionForm({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: NewTransactionFormProps) {
  const { products = [], loading: productsLoading } = useProducts();
  // Fetch employees from the backend
  const { employees = [], loading: employeesLoading, error: employeesError } = useEmployees();

  // For debugging
  console.log('Employees:', employees);
  console.log('Employees loading:', employeesLoading);
  console.log('Employees error:', employeesError);
  const [selectedCashier, setSelectedCashier] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // Auto-generated payment reference number
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');
  const [searchProduct, setSearchProduct] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fixed tax and discount rates
  const TAX_RATE = 18; // 18% GST
  const STORE_DISCOUNT_RATE = 10; // 10% store discount

  // Combined loading state (external prop or internal state)
  const submitting = isSubmitting || loading;

  // Customer form data
  const [customerData, setCustomerData] = useState({
    name: '',
    phone_no: '',
  });

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return products.filter(
      (product: Product) =>
        product.product_name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        product.product_id.toString().includes(searchProduct),
    );
  }, [products, searchProduct]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = selectedItems.reduce((sum, item) => {
      const itemTotal = item.unit_price * item.quantity - (item.discount || 0);
      return sum + itemTotal;
    }, 0);

    // Apply fixed store discount (10%)
    const storeDiscount = (subtotal * STORE_DISCOUNT_RATE) / 100;
    const discountTotal = storeDiscount; // Only store discount now, no per-item discounts

    // Apply fixed tax rate (18%)
    const taxableAmount = subtotal - discountTotal;
    const taxAmount = (taxableAmount * TAX_RATE) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
      subtotal,
      discountTotal,
      storeDiscount,
      taxAmount,
      totalAmount,
      totalItems: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      uniqueProducts: selectedItems.length,
    };
  }, [selectedItems, STORE_DISCOUNT_RATE, TAX_RATE]);

  const addProductToTransaction = (product: Product) => {
    const existingItem = selectedItems.find(
      (item) => item.product_id === product.product_id.toString(),
    );

    if (existingItem) {
      updateItemQuantity(existingItem.product_id, existingItem.quantity + 1);
    } else {
      const newItem: TransactionItem = {
        product_id: product.product_id.toString(),
        product_name: product.product_name,
        quantity: 1,
        unit_price: product.default_price,
        discount: 0,
        available_stock: product.stock,
      };
      setSelectedItems([...selectedItems, newItem]);
    }
    setSearchProduct('');
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setSelectedItems((items) =>
      items.map((item) => {
        if (item.product_id === productId) {
          const validQuantity = Math.min(newQuantity, item.available_stock);
          return {
            ...item,
            quantity: validQuantity,
          };
        }
        return item;
      }),
    );
  };

  // Removed the updateItemDiscount function as item-specific discounts are no longer needed

  const updateItemDiscount = (productId: string, discount: number) => {
    setSelectedItems((items) =>
      items.map((item) => {
        if (item.product_id === productId) {
          const subtotal = item.quantity * item.unit_price;
          const validDiscount = Math.min(Math.max(0, discount), subtotal);
          return {
            ...item,
            discount: validDiscount,
          };
        }
        return item;
      }),
    );
  };

  const removeItem = (productId: string) => {
    setSelectedItems((items) => items.filter((item) => item.product_id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCashier) {
      alert('Please select a cashier');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please add at least one product to the transaction');
      return;
    }

    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        cashier_id: selectedCashier,
        payment_method: paymentMethod,
        payment_refno: paymentRefNumber || null,
        customer_name: customerData.name || null,
        customer_phone: customerData.phone_no || null,
        items: selectedItems.map((item) => ({
          product_id: parseInt(item.product_id, 10),
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price.toString()),
          discount: parseFloat(item.discount.toString()),
        })),
        new_customer: customerData.name
          ? {
              name: customerData.name,
              phone_no: customerData.phone_no,
            }
          : null,
        subtotal: calculations.subtotal,
        tax_amount: calculations.taxAmount,
        discount_amount: calculations.discountTotal,
        total_amt: calculations.totalAmount,
      };

      await onSubmit(transactionData);

      // Reset form
      setSelectedCashier('');
      setSelectedItems([]);
      setPaymentMethod('');
      setPaymentRefNumber('');
      setCustomerData({ name: '', phone_no: '' });

      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Transaction</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer and Cashier Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      value={customerData.phone_no}
                      onChange={(e) =>
                        setCustomerData({ ...customerData, phone_no: e.target.value })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cashier Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cashier Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="cashier">Select Cashier *</Label>
                  <Select value={selectedCashier} onValueChange={setSelectedCashier} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a cashier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee: Employee) => (
                        <SelectItem key={employee.employee_id} value={employee.employee_id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Product Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div>
                <Label htmlFor="productSearch">Search Products</Label>
                <Input
                  id="productSearch"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  placeholder="Search by product name or ID..."
                />
              </div>

              {/* Product Search Results */}
              {searchProduct && filteredProducts.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-neutral-700 rounded-lg">
                  {filteredProducts.map((product: Product) => (
                    <div
                      key={product.product_id}
                      className="p-3 border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer flex items-center justify-between"
                      onClick={() => addProductToTransaction(product)}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.product_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {product.product_id} • Stock: {product.stock} • Price:{' '}
                          {formatIndianRupee(product.default_price)}
                        </p>
                      </div>
                      <Button size="sm" type="button">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Selected Items</h4>
                  {selectedItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="p-4 border border-gray-200 dark:border-neutral-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.product_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ID: {item.product_id} • Available: {item.available_stock}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                updateItemQuantity(item.product_id, value > 0 ? value : 1);
                              }}
                              className="text-center"
                              min="1"
                              max={item.available_stock}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.available_stock}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Unit Price</Label>
                          <p className="text-sm font-medium py-2">
                            {formatIndianRupee(item.unit_price)}
                          </p>
                        </div>

                        {/* Item discount field removed */}

                        <div>
                          <Label className="text-xs">Total</Label>
                          <p className="text-sm font-bold py-2 text-green-600 dark:text-green-400">
                            {formatIndianRupee(
                              item.unit_price * item.quantity - (item.discount || 0),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => {
                      setPaymentMethod(value);
                      setPaymentRefNumber(generatePaymentReference(value));
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          <div className="flex items-center gap-2">
                            <span>{method.icon}</span>
                            {method.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  {paymentMethod && (
                    <>
                      <Label htmlFor="paymentRefNo">
                        {paymentMethod === 'Cash' && 'Receipt Number'}
                        {paymentMethod === 'Credit Card' && 'Credit Card Reference'}
                        {paymentMethod === 'Debit Card' && 'Transaction ID'}
                        {paymentMethod === 'Mobile Payment' && 'UPI/Mobile Reference'}
                      </Label>
                      <Input
                        id="paymentRefNo"
                        value={paymentRefNumber}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tax rate and discount information */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Fixed Transaction Rates</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Store Discount: {STORE_DISCOUNT_RATE}% (applied to subtotal)</li>
                    <li>• Tax Rate: {TAX_RATE}% (applied after discounts)</li>
                  </ul>
                </div>
              </div>

              <div className="h-[1px] bg-gray-200 dark:bg-neutral-700 my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">{formatIndianRupee(calculations.subtotal)}</span>
                </div>

                {/* Store Discount */}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Store Discount ({STORE_DISCOUNT_RATE}%):
                  </span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatIndianRupee(calculations.storeDiscount)}
                  </span>
                </div>

                {/* Item-specific discounts removed */}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax ({TAX_RATE}%):</span>
                  <span className="font-medium">{formatIndianRupee(calculations.taxAmount)}</span>
                </div>

                <div className="h-[1px] bg-gray-200 dark:bg-neutral-700 my-3" />

                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatIndianRupee(calculations.totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {calculations.totalItems} items • {calculations.uniqueProducts} products
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-neutral-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Complete Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_SALES_ORDER, GET_SALES_ORDERS } from '@/lib/graphql/sales';
import { GET_PRODUCTS } from '@/lib/graphql/product';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SalesOrderItem {
  product_id: string;
  ordered_quantity: number;
}

interface CreateSalesOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSalesOrderModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateSalesOrderModalProps) {
  const params = useParams();
  const companySlug = params.slug as string;

  const [customerName, setCustomerName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState<SalesOrderItem[]>([{ product_id: '', ordered_quantity: 0 }]);

  const { data: productsData } = useQuery(GET_PRODUCTS);
  const products = productsData?.products || [];

  const [createOrder, { loading }] = useMutation(CREATE_SALES_ORDER, {
    refetchQueries: [{ query: GET_SALES_ORDERS }],
    onCompleted: () => {
      toast.success('Sales order created successfully');
      handleClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addItem = () => {
    setItems([...items, { product_id: '', ordered_quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleClose = () => {
    setCustomerName('');
    setExpectedDate('');
    setItems([{ product_id: '', ordered_quantity: 0 }]);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    const validItems = items.filter(
      (item) => item.product_id && item.ordered_quantity > 0
    );

    if (validItems.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    createOrder({
      variables: {
        input: {
          customer_name: customerName,
          expected_dispatch_date: expectedDate || undefined,
          items: validItems,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Sales Order</DialogTitle>
            <DialogDescription>
              Add a new customer order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Order Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Expected Dispatch Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Product *</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28 space-y-2">
                      <Label className="text-xs">Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.ordered_quantity || ''}
                        onChange={(e) =>
                          updateItem(index, 'ordered_quantity', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

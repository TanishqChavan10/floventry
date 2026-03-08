'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useCreateSalesOrder, useProducts } from '@/hooks/apollo';
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
import { CopyButton } from '@/components/common/CopyButton';
import { BarcodeScanInput } from '@/components/barcode/BarcodeScanInput';

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

  const { data: productsData } = useProducts();
  const products = productsData?.products || [];

  const [createOrder, { loading }] = useCreateSalesOrder({
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

  const addOrIncrementItem = (productId: string, quantityToAdd: number) => {
    const safeQty = Number.isFinite(quantityToAdd) && quantityToAdd > 0 ? quantityToAdd : 1;

    setItems((prev) => {
      const existingIndex = prev.findIndex((it) => it.product_id === productId);
      if (existingIndex !== -1) {
        const next = [...prev];
        const currentQty = Number.isFinite(next[existingIndex].ordered_quantity)
          ? next[existingIndex].ordered_quantity
          : 0;
        next[existingIndex] = {
          ...next[existingIndex],
          ordered_quantity: currentQty + safeQty,
        };
        return next;
      }

      const emptyIndex = prev.findIndex((it) => !it.product_id);
      if (emptyIndex !== -1) {
        const next = [...prev];
        next[emptyIndex] = { product_id: productId, ordered_quantity: safeQty };
        return next;
      }

      return [...prev, { product_id: productId, ordered_quantity: safeQty }];
    });
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

    const validItems = items.filter((item) => item.product_id && item.ordered_quantity > 0);

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
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle>Create Sales Order</DialogTitle>
            <DialogDescription>Add a new customer order</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-6 pb-4">
              {/* Order Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">
                    Customer Name <span className="text-destructive">*</span>
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

                <BarcodeScanInput
                  label="Scan barcode"
                  description="Scan a product barcode to add it to the order (or increase quantity)."
                  onProductResolved={(product, _scanned, scanMeta) => {
                    const qty = typeof scanMeta?.quantity === 'number' ? scanMeta.quantity : 1;
                    addOrIncrementItem(product.id, qty);
                  }}
                  onError={(message) => toast.error(message)}
                />

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-3 items-start p-3 border rounded-lg bg-muted/40 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"
                    >
                      <div className="min-w-0 space-y-2">
                        <Label className="text-xs">Product *</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, 'product_id', value)}
                        >
                          <SelectTrigger className="min-w-0">
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
                        {(() => {
                          const selectedProduct = products.find(
                            (p: any) => p.id === item.product_id,
                          );
                          if (!selectedProduct) return null;

                          return (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="font-mono">SKU: {selectedProduct.sku}</span>
                              <CopyButton
                                value={selectedProduct.sku}
                                ariaLabel="Copy SKU"
                                successMessage="Copied SKU to clipboard"
                                className="h-6 w-6 text-muted-foreground"
                              />
                            </div>
                          );
                        })()}
                      </div>
                      <div className="space-y-2">
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
                        className="sm:self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
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

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_ISSUE_NOTE_WITH_FEFO, GET_ISSUE_NOTES_BY_WAREHOUSE } from '@/lib/graphql/issues';
import { GET_SALES_ORDERS } from '@/lib/graphql/sales';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { Loader2, Plus, Trash2, Info } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useWarehouse } from '@/context/warehouse-context';
import { CopyButton } from '@/components/common/CopyButton';

interface IssueItem {
  product_id: string;
  quantity: number;
}

interface SalesOrderItem {
  product: {
    id: string;
  };
  pending_quantity: number;
}

interface SalesOrder {
  id: string;
  status: string;
  customer_name: string;
  items?: SalesOrderItem[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  availableQty?: number;
}

interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateIssueModal({ open, onOpenChange, onSuccess }: CreateIssueModalProps) {
  const params = useParams();
  const { activeWarehouse } = useWarehouse();

  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  const [salesOrderId, setSalesOrderId] = useState<string>('');
  const [items, setItems] = useState<IssueItem[]>([]);
  const [prefilledFromSalesOrderId, setPrefilledFromSalesOrderId] = useState<string>('');

  const { data: salesOrdersData } = useQuery(GET_SALES_ORDERS);
  const { data: warehouseStockData } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: { warehouseId: activeWarehouse?.id },
    skip: !activeWarehouse?.id,
    fetchPolicy: 'cache-and-network',
  });

  const salesOrders = useMemo<SalesOrder[]>(
    () => (salesOrdersData?.salesOrders ?? []) as SalesOrder[],
    [salesOrdersData],
  );

  const products = useMemo<Product[]>(() => {
    const stocks = (warehouseStockData?.stockByWarehouse ?? []) as any[];
    return stocks
      .filter((s) => Number(s?.quantity ?? 0) > 0)
      .map((s) => ({
        id: s.product.id,
        name: s.product.name,
        sku: s.product.sku,
        availableQty: Number(s.quantity ?? 0),
      }));
  }, [warehouseStockData]);

  const availableProductIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);

  const prefillItemsFromSalesOrder = useCallback(
    (selectedSalesOrderId: string) => {
      const salesOrder = salesOrders.find((so) => so.id === selectedSalesOrderId);
      const salesOrderItems = salesOrder?.items || [];

      const rawPrefilledItems: IssueItem[] = salesOrderItems
        .filter((soi) => (soi.product?.id ? (soi.pending_quantity ?? 0) > 0 : false))
        .map((soi) => ({
          product_id: soi.product.id,
          quantity: 0,
        }));

      const prefilledItems = rawPrefilledItems.filter((i) => availableProductIds.has(i.product_id));
      const skippedCount = rawPrefilledItems.length - prefilledItems.length;

      setItems(prefilledItems);
      setPrefilledFromSalesOrderId(selectedSalesOrderId);

      if (skippedCount > 0) {
        toast.info(
          `${skippedCount} item(s) from the sales order are not currently in stock in this warehouse and were skipped.`,
        );
      }

      if (prefilledItems.length === 0) {
        toast.info('The selected sales order has no pending quantities to issue.');
      }
    },
    [salesOrders, availableProductIds],
  );

  useEffect(() => {
    if (salesOrderId && salesOrderId !== prefilledFromSalesOrderId && salesOrders.length > 0) {
      prefillItemsFromSalesOrder(salesOrderId);
    }
  }, [salesOrderId, prefilledFromSalesOrderId, salesOrders.length, prefillItemsFromSalesOrder]);

  const [createIssue, { loading }] = useMutation(CREATE_ISSUE_NOTE_WITH_FEFO, {
    refetchQueries: [
      { query: GET_ISSUE_NOTES_BY_WAREHOUSE, variables: { warehouseId: activeWarehouse?.id } },
    ],
    onCompleted: (data) => {
      toast.success('Issue note created successfully with FEFO lot selection');
      handleClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = <K extends keyof IssueItem>(index: number, field: K, value: IssueItem[K]) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleClose = () => {
    setSalesOrderId('');
    setItems([]);
    setPrefilledFromSalesOrderId('');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeWarehouse?.id) {
      toast.error('No active warehouse');
      return;
    }

    const validItems = items.filter((item) => item.product_id && item.quantity > 0);

    if (validItems.length === 0) {
      toast.error('At least one item with quantity is required');
      return;
    }

    createIssue({
      variables: {
        input: {
          warehouse_id: activeWarehouse.id,
          sales_order_id: salesOrderId || undefined,
          items: validItems,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Issue Note</DialogTitle>
            <DialogDescription>Issue goods from warehouse</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Sales Order Selection */}
            <div className="space-y-2">
              <Label htmlFor="salesOrder">Link to Sales Order (Optional)</Label>
              <Select
                value={salesOrderId || 'NONE'}
                onValueChange={(value) => {
                  const nextId = value === 'NONE' ? '' : value;
                  setSalesOrderId(nextId);

                  if (nextId) {
                    prefillItemsFromSalesOrder(nextId);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales order (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (Direct Issue)</SelectItem>
                  {salesOrders
                    .filter((so) => so.status === 'CONFIRMED')
                    .map((so) => (
                      <SelectItem key={so.id} value={so.id}>
                        {so.customer_name} - {so.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {!salesOrderId && (
                <p className="text-sm text-slate-500">Direct issue (not linked to a sales order)</p>
              )}
            </div>

            {/* FEFO Info Alert */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Automatic Lot Selection (FEFO):</strong> Lots will be automatically selected
                based on earliest expiry date. No manual lot selection needed!
              </AlertDescription>
            </Alert>

            {/* Issue Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Issue Items</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed rounded-lg">
                  <p className="text-sm">
                    No items added yet. Click &quot;Add Item&quot; to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {items.map((item, index) => {
                    const product = products.find((p) => p.id === item.product_id);
                    return (
                      <div
                        key={index}
                        className="flex gap-3 items-end p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50"
                      >
                        <div className="flex-1">
                          <Label className="mb-2 block text-xs">Product</Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, 'product_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No products with stock in this warehouse
                                </div>
                              ) : (
                                products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                    {typeof product.availableQty === 'number'
                                      ? ` — ${product.availableQty}`
                                      : ''}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {product?.sku ? (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="font-mono">SKU: {product.sku}</span>
                              <CopyButton
                                value={product.sku}
                                ariaLabel="Copy SKU"
                                successMessage="Copied SKU to clipboard"
                                className="h-6 w-6 text-muted-foreground"
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="w-32">
                          <Label className="mb-2 block text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                          />
                          {product && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Available: {product.availableQty}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Issue Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

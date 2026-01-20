'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_ISSUE_NOTE_WITH_FEFO } from '@/lib/graphql/issues';
import { GET_SALES_ORDERS } from '@/lib/graphql/sales';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { Loader2, Plus, Trash2, ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useWarehouse } from '@/context/warehouse-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarcodeScanInput } from '@/components/barcode/BarcodeScanInput';

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

export default function NewIssueNotePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { activeWarehouse } = useWarehouse();

  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  const [salesOrderId, setSalesOrderId] = useState<string>('');
  const [items, setItems] = useState<IssueItem[]>([]);
  const [prefilledFromSalesOrderId, setPrefilledFromSalesOrderId] = useState<string>('');
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  useEffect(() => {
    if (highlightIndex === null) return;
    const el = document.getElementById(`issue-item-${highlightIndex}`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlightIndex]);

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
        toast({
          title: 'Some items unavailable',
          description: `${skippedCount} item(s) from the sales order are not currently in stock in this warehouse and were skipped.`,
        });
      }

      if (prefilledItems.length === 0) {
        toast({
          title: 'No pending items',
          description: 'The selected sales order has no pending quantities to issue.',
        });
      }
    },
    [salesOrders, toast, availableProductIds],
  );

  useEffect(() => {
    // If a sales order was selected before the list finished loading, prefill once data arrives.
    if (salesOrderId && salesOrderId !== prefilledFromSalesOrderId && salesOrders.length > 0) {
      prefillItemsFromSalesOrder(salesOrderId);
    }
  }, [salesOrderId, prefilledFromSalesOrderId, salesOrders.length, prefillItemsFromSalesOrder]);

  const [createIssue, { loading }] = useMutation(CREATE_ISSUE_NOTE_WITH_FEFO, {
    onCompleted: (data) => {
      toast({
        title: 'Success',
        description: 'Issue note created successfully with FEFO lot selection',
      });
      router.push(
        `/${companySlug}/warehouses/${warehouseSlug}/issues/${data.createIssueNoteWithFEFO.id}`,
      );
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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

  const selectProductFromBarcode = (productId: string) => {
    if (!availableProductIds.has(productId)) {
      toast({
        title: 'Not available in this warehouse',
        description: 'This product is not currently in stock here.',
        variant: 'destructive',
      });
      return;
    }

    const existingIndex = items.findIndex((i) => i.product_id === productId);
    if (existingIndex >= 0) {
      setHighlightIndex(existingIndex);
      toast({
        title: 'Already added',
        description: 'That product is already in the issue list.',
      });
      return;
    }

    const emptyIndex = items.findIndex((i) => !i.product_id);
    if (emptyIndex >= 0) {
      updateItem(emptyIndex, 'product_id', productId);
      setHighlightIndex(emptyIndex);
      return;
    }

    setItems((prev) => {
      const next = [...prev, { product_id: productId, quantity: 0 }];
      setHighlightIndex(next.length - 1);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeWarehouse?.id) {
      toast({
        title: 'Error',
        description: 'No active warehouse',
        variant: 'destructive',
      });
      return;
    }

    const validItems = items.filter((item) => item.product_id && item.quantity > 0);

    if (validItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one item with quantity is required',
        variant: 'destructive',
      });
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
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-4">
        <Link href={`/${companySlug}/warehouses/${warehouseSlug}/issues`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h3 className="text-3xl font-bold tracking-tight">Create Issue Note</h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Issue goods from warehouse</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="salesOrder">Link to Sales Order (Optional)</Label>
              <Select
                value={salesOrderId || 'NONE'}
                onValueChange={(value) => {
                  const nextId = value === 'NONE' ? '' : value;
                  setSalesOrderId(nextId);

                  // Auto-populate issue items from the chosen Sales Order
                  if (nextId) {
                    prefillItemsFromSalesOrder(nextId);
                  }
                }}
              >
                <SelectTrigger className="mt-2">
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
                <p className="text-sm text-slate-500 mt-2">
                  Direct issue (not linked to a sales order)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FEFO Info Alert */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Automatic Lot Selection (FEFO):</strong> Lots will be automatically selected
            based on earliest expiry date. No manual lot selection needed!
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Issue Items</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <BarcodeScanInput
              label="Scan barcode to select product"
              description="Scan only selects a product. Quantity stays manual."
              onProductResolved={(product) => {
                selectProductFromBarcode(product.id);
              }}
              onError={(message) =>
                toast({
                  title: 'Barcode scan failed',
                  description: message,
                  variant: 'destructive',
                })
              }
            />

            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium">No items added yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Click &quot;Add Item&quot; to get started
                </p>
              </div>
            ) : (
              items.map((item, index) => {
                return (
                  <div
                    key={index}
                    id={`issue-item-${index}`}
                    className={
                      `flex gap-4 items-end p-6 border rounded-lg bg-slate-50 dark:bg-slate-900/50 ` +
                      (highlightIndex === index ? 'ring-2 ring-indigo-500 border-indigo-300' : '')
                    }
                  >
                    <div className="flex-1">
                      <Label className="mb-2 block">Product</Label>
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
                    </div>
                    <div className="w-32">
                      <Label className="mb-2 block">Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                      />
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
              })
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Link href={`/${companySlug}/warehouses/${warehouseSlug}/issues`}>
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading} size="lg">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Issue Note
          </Button>
        </div>
      </form>
    </div>
  );
}

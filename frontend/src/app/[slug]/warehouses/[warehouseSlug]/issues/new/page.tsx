'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_ISSUE_NOTE } from '@/lib/graphql/issues';
import { GET_SALES_ORDERS } from '@/lib/graphql/sales';
import { GET_PRODUCTS } from '@/lib/graphql/product';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { LotPickerModal } from '@/components/issues/LotPickerModal';
import { useToast } from '@/components/ui/use-toast';
import { useWarehouse } from '@/context/warehouse-context';

interface IssueItem {
  product_id: string;
  stock_lot_id?: string;
  quantity: number;
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
  const [lotPickerOpen, setLotPickerOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const { data: salesOrdersData } = useQuery(GET_SALES_ORDERS);
  const { data: productsData } = useQuery(GET_PRODUCTS);

  const salesOrders = salesOrdersData?.salesOrders || [];
  const products = productsData?.products || [];

  const [createIssue, { loading }] = useMutation(CREATE_ISSUE_NOTE, {
    onCompleted: (data) => {
      toast({
        title: 'Success',
        description: 'Issue note created successfully',
      });
      router.push(`/${companySlug}/warehouses/${warehouseSlug}/issues/${data.createIssueNote.id}`);
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

  const updateItem = (index: number, field: keyof IssueItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const openLotPicker = (index: number) => {
    if (!items[index].product_id) {
      toast({
        title: 'Select Product First',
        description: 'Please select a product before choosing lots',
        variant: 'destructive',
      });
      return;
    }
    setSelectedItemIndex(index);
    setLotPickerOpen(true);
  };

  const handleLotsSelected = (selectedLots: Array<{ lot_id: string; quantity: number }>) => {
    if (selectedItemIndex === null) return;

    // Remove the current item and add multiple items for each lot
    const currentItem = items[selectedItemIndex];
    const newItems = [...items];
    newItems.splice(selectedItemIndex, 1);

    // Add an item for each selected lot
    const lotItems = selectedLots.map((lot) => ({
      product_id: currentItem.product_id,
      stock_lot_id: lot.lot_id,
      quantity: lot.quantity,
    }));

    setItems([...newItems, ...lotItems]);
    setSelectedItemIndex(null);
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

  const selectedProduct = products.find((p: any) =>
    selectedItemIndex !== null ? p.id === items[selectedItemIndex]?.product_id : false
  );

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
              <Select value={salesOrderId || 'NONE'} onValueChange={(value) => setSalesOrderId(value === 'NONE' ? '' : value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select sales order (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (Direct Issue)</SelectItem>
                  {salesOrders
                    .filter((so: any) => so.status === 'CONFIRMED')
                    .map((so: any) => (
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
            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium">No items added yet</p>
                <p className="text-sm text-slate-400 mt-1">Click "Add Item" to get started</p>
              </div>
            ) : (
              items.map((item, index) => {
                const product = products.find((p: any) => p.id === item.product_id);
                return (
                  <div key={index} className="flex gap-4 items-end p-6 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
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
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
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
                        disabled={!!item.stock_lot_id}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openLotPicker(index)}
                        disabled={!item.product_id}
                      >
                        Select Lot
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.stock_lot_id && (
                      <div className="w-full col-span-full mt-2">
                        <Badge variant="secondary" className="gap-1">
                          📦 Lot: {item.stock_lot_id.slice(0, 8)}... ({item.quantity} {product?.unit})
                        </Badge>
                      </div>
                    )}
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

      {/* Lot Picker Modal */}
      {selectedItemIndex !== null && selectedProduct && (
        <LotPickerModal
          open={lotPickerOpen}
          onOpenChange={setLotPickerOpen}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          warehouseId={activeWarehouse?.id || ''}
          requiredQuantity={items[selectedItemIndex]?.quantity}
          onConfirm={handleLotsSelected}
        />
      )}
    </div>
  );
}

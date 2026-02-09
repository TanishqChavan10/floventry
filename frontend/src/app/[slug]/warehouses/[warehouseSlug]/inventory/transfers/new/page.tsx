'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { differenceInCalendarDays, format } from 'date-fns';
import RoleGuard from '@/components/guards/RoleGuard';
import { useWarehouse } from '@/context/warehouse-context';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CopyButton } from '@/components/common/CopyButton';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, Send, AlertTriangle, Plus, X } from 'lucide-react';
import {
  CREATE_WAREHOUSE_TRANSFER,
  POST_WAREHOUSE_TRANSFER,
  GET_WAREHOUSE_TRANSFERS,
} from '@/lib/graphql/transfers';
import { GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { GET_WAREHOUSE_STOCK_HEALTH } from '@/lib/graphql/stock-health';
import { toast } from 'sonner';
import Link from 'next/link';
import { SafeBarcodeScanInput } from '@/components/barcode/SafeBarcodeScanInput';

interface TransferItemInput {
  product_id: string;
  quantity: number;
  product_name?: string;
  available_stock?: number;
  sku?: string;
}

function CreateTransferContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const companySlug = params?.slug as string;
  const warehouseSlug = params?.warehouseSlug as string;
  const { activeWarehouse } = useWarehouse();

  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItemInput[]>([]);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [draftTransferId, setDraftTransferId] = useState<string | null>(null);
  const [hasPrefilledItem, setHasPrefilledItem] = useState(false);
  const [lastScan, setLastScan] = useState<{
    barcode: string;
    productId: string;
    productName: string;
    sku: string;
  } | null>(null);

  useEffect(() => {
    if (highlightIndex === null) return;
    const row = document.getElementById(`transfer-item-${highlightIndex}`);
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' });

    window.setTimeout(() => {
      const qtyEl = document.getElementById(`transfer-item-qty-${highlightIndex}`);
      if (qtyEl instanceof HTMLInputElement) qtyEl.focus();
    }, 50);
  }, [highlightIndex]);

  // Fetch all company warehouses (excluding current one for destination)
  const { data: warehousesData, loading: loadingWarehouses } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });

  // Fetch source warehouse stock
  const { data: stockData, loading: loadingStock } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: { warehouseId: activeWarehouse?.id || '' },
    skip: !activeWarehouse?.id,
  });

  const { data: stockHealthData } = useQuery(GET_WAREHOUSE_STOCK_HEALTH, {
    variables: { warehouseId: activeWarehouse?.id || '' },
    skip: !activeWarehouse?.id,
    fetchPolicy: 'cache-and-network',
  });

  const [createTransfer, { loading: creating }] = useMutation(CREATE_WAREHOUSE_TRANSFER, {
    refetchQueries: [{ query: GET_WAREHOUSE_TRANSFERS, variables: { filters: { limit: 100 } } }],
  });

  const [postTransfer, { loading: posting }] = useMutation(POST_WAREHOUSE_TRANSFER, {
    refetchQueries: [{ query: GET_WAREHOUSE_TRANSFERS, variables: { filters: { limit: 100 } } }],
  });

  const warehouses = (warehousesData?.companyBySlug?.warehouses || []).filter(
    (w: any) => w.id !== activeWarehouse?.id,
  );

  const stock = stockData?.stockByWarehouse || [];

  const stockHealthByProductId = useMemo(() => {
    const rows = (stockHealthData?.warehouseStockHealth ?? []) as any[];
    const map = new Map<string, any>();
    for (const row of rows) {
      if (row?.productId) map.set(row.productId, row);
    }
    return map;
  }, [stockHealthData]);

  // Auto-prefill item from URL query params (from Low Stock page)
  useEffect(() => {
    if (hasPrefilledItem || !stock.length) return;

    const productIdParam = searchParams.get('productId');
    const stockIdParam = searchParams.get('stockId');

    if (productIdParam || stockIdParam) {
      // Find the stock item by productId or stockId
      const stockItem = stock.find(
        (s: any) => s.product.id === productIdParam || s.id === stockIdParam,
      );

      if (stockItem) {
        // Auto-add this item to the transfer
        setItems([
          {
            product_id: stockItem.product.id,
            quantity: 0, // User needs to specify quantity
            product_name: stockItem.product.name,
            available_stock: Number(stockItem.quantity),
            sku: stockItem.product.sku,
          },
        ]);
        setHasPrefilledItem(true);
      }
    }
  }, [searchParams, stock, hasPrefilledItem]);

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    if (field === 'product_id') {
      const product = stock.find((s: any) => s.product.id === value);
      if (product) {
        updated[index] = {
          product_id: value,
          quantity: 0,
          product_name: product.product.name,
          available_stock: Number(product.quantity),
          sku: product.product.sku,
        };
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  };

  const selectProductFromBarcode = (productId: string) => {
    const stockItem = stock.find((s: any) => s.product?.id === productId);
    if (!stockItem) {
      toast.error('Not available in this warehouse');
      return;
    }

    const existingIndex = items.findIndex((i) => i.product_id === productId);
    if (existingIndex >= 0) {
      setHighlightIndex(existingIndex);
      toast.error('That product is already in the transfer list');
      return;
    }

    const emptyIndex = items.findIndex((i) => !i.product_id);
    if (emptyIndex >= 0) {
      updateItem(emptyIndex, 'product_id', productId);
      setHighlightIndex(emptyIndex);
      return;
    }

    setItems((prev) => {
      const next = [
        ...prev,
        {
          product_id: stockItem.product.id,
          quantity: 0,
          product_name: stockItem.product.name,
          available_stock: Number(stockItem.quantity),
          sku: stockItem.product.sku,
        },
      ];
      setHighlightIndex(next.length - 1);
      return next;
    });
  };

  const canSaveAndPost = useMemo(() => {
    if (creating || posting) return false;
    if (!activeWarehouse?.id) return false;
    if (!destinationWarehouseId) return false;
    if (items.length === 0) return false;

    // Must have at least one valid line item; do not auto-submit on barcode.
    return items.every((item) => {
      if (!item.product_id) return false;
      if (Number(item.quantity) <= 0) return false;
      const available = Number(item.available_stock ?? 0);
      return Number(item.quantity) <= available;
    });
  }, [activeWarehouse?.id, creating, destinationWarehouseId, items, posting]);

  const validateItems = () => {
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }

    for (const item of items) {
      if (!item.product_id) {
        toast.error('Please select a product for all items');
        return false;
      }
      if (item.quantity <= 0) {
        toast.error('All quantities must be greater than 0');
        return false;
      }
      if (item.quantity > (item.available_stock || 0)) {
        toast.error(
          `Insufficient stock for ${item.product_name}. Available: ${item.available_stock}`,
        );
        return false;
      }
    }

    // Check for duplicate products
    const productIds = items.map((i) => i.product_id);
    if (new Set(productIds).size !== productIds.length) {
      toast.error('Cannot add the same product multiple times');
      return false;
    }

    return true;
  };

  const handleSaveDraft = async () => {
    if (!activeWarehouse) {
      toast.error('Source warehouse not found');
      return;
    }

    if (!destinationWarehouseId) {
      toast.error('Please select a destination warehouse');
      return;
    }

    if (!validateItems()) {
      return;
    }

    try {
      const result = await createTransfer({
        variables: {
          input: {
            source_warehouse_id: activeWarehouse.id,
            destination_warehouse_id: destinationWarehouseId,
            items: items.map((item) => ({
              product_id: item.product_id,
              quantity: Math.floor(Number(item.quantity)),
            })),
            notes: notes || undefined,
          },
        },
      });

      setDraftTransferId(result.data.createWarehouseTransfer.id);
      toast.success('Transfer saved as draft');
      setShowPostDialog(true);
    } catch (error: any) {
      console.error('Error creating transfer:', error);
      toast.error(error.message || 'Failed to create transfer');
    }
  };

  const handlePost = async () => {
    if (!draftTransferId) return;

    try {
      await postTransfer({ variables: { id: draftTransferId } });
      toast.success('Transfer posted successfully! Stock has been updated.');
      router.push(
        `/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers/${draftTransferId}`,
      );
    } catch (error: any) {
      console.error('Error posting transfer:', error);
      toast.error(error.message || 'Failed to post transfer');
    }
  };

  const handleSaveAndExit = () => {
    if (draftTransferId) {
      router.push(
        `/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers/${draftTransferId}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Create Warehouse Transfer</h1>
              <p className="text-muted-foreground">
                Move stock from {activeWarehouse?.name} to another warehouse
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Warehouse Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From Warehouse</Label>
                <Input value={activeWarehouse?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>To Warehouse *</Label>
                <Select
                  value={destinationWarehouseId}
                  onValueChange={setDestinationWarehouseId}
                  disabled={loadingWarehouses || warehouses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingWarehouses
                          ? 'Loading warehouses...'
                          : warehouses.length === 0
                            ? 'No other warehouses available'
                            : 'Select destination warehouse'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w: any) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transfer Items</CardTitle>
              <Button onClick={addItem} size="sm" className="gap-2" disabled={loadingStock}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <SafeBarcodeScanInput
                context="TRANSFER"
                label="Scan barcode to select product"
                description="Scan selects a product only — you still confirm quantity and submit."
                disabled={!activeWarehouse?.id || loadingStock}
                onProductResolved={(product, scannedBarcode) => {
                  setLastScan({
                    barcode: scannedBarcode,
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku,
                  });
                  selectProductFromBarcode(product.id);
                }}
                onError={(message) => toast.error(message)}
              />

              {lastScan ? (
                <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-foreground">
                  <div className="font-medium">
                    Product selected via barcode. Please confirm quantity.
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Selected: {lastScan.productName} ({lastScan.sku})
                  </div>
                  {(() => {
                    const health = stockHealthByProductId.get(lastScan.productId);
                    if (!health) return null;
                    const usableStock = Number(health.usableStock ?? 0);
                    const nearestExpiryDate = health.nearestExpiryDate
                      ? new Date(health.nearestExpiryDate)
                      : null;
                    const daysToExpiry = nearestExpiryDate
                      ? differenceInCalendarDays(nearestExpiryDate, new Date())
                      : null;
                    const expiryLabel = nearestExpiryDate
                      ? `${format(nearestExpiryDate, 'dd MMM yyyy')}${
                          typeof daysToExpiry === 'number' ? ` (${daysToExpiry}d)` : ''
                        }`
                      : '—';
                    const hasExpiryWarning = Number(health.expiringSoonQty ?? 0) > 0;

                    return (
                      <div className="mt-2 grid gap-1">
                        <div>Usable stock: {usableStock}</div>
                        <div>
                          Nearest expiry: {expiryLabel}
                          {hasExpiryWarning ? (
                            <Badge className="ml-2" variant="secondary">
                              expiring soon
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Click "Add Item" to begin.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product *</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Quantity *</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={index}
                      id={`transfer-item-${index}`}
                      className={
                        highlightIndex === index
                          ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                          : undefined
                      }
                    >
                      <TableCell>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, 'product_id', value)}
                        >
                          <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {stock.map((s: any) => (
                              <SelectItem
                                key={s.product.id}
                                value={s.product.id}
                                disabled={items.some(
                                  (i) =>
                                    i.product_id === s.product.id &&
                                    items[index].product_id !== s.product.id,
                                )}
                              >
                                {s.product.name} (Stock: {s.quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1">
                          <span>{item.sku || '—'}</span>
                          <CopyButton
                            value={item.sku ?? ''}
                            ariaLabel="Copy SKU"
                            successMessage="Copied SKU to clipboard"
                            className="h-7 w-7 text-muted-foreground"
                            disabled={!item.sku}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.available_stock !== undefined ? item.available_stock : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          id={`transfer-item-qty-${index}`}
                          type="number"
                          min="0"
                          max={item.available_stock}
                          value={item.quantity || ''}
                          onChange={(e) =>
                            updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 text-right"
                          disabled={!item.product_id}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any additional notes about this transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/${companySlug}/warehouses/${warehouseSlug}/inventory/transfers`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSaveDraft} disabled={!canSaveAndPost} className="gap-2">
            <Save className="h-4 w-4" />
            {creating ? 'Saving...' : 'Save & Post'}
          </Button>
        </div>
      </main>

      {/* Post Confirmation Dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Post Warehouse Transfer?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Posting this transfer will immediately:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Decrease stock in the source warehouse</li>
                  <li>Increase stock in the destination warehouse</li>
                  <li>Create stock movement records</li>
                </ul>
                <p className="mt-3">This action cannot be undone. Do you want to proceed?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSaveAndExit}>Save as Draft & Exit</AlertDialogCancel>
            <AlertDialogAction onClick={handlePost} disabled={posting}>
              <Send className="h-4 w-4 mr-2" />
              {posting ? 'Posting...' : 'Post Transfer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CreateTransferPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN', 'MANAGER']}>
      <CreateTransferContent />
    </RoleGuard>
  );
}

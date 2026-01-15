'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { useWarehouse } from '@/context/warehouse-context';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Plus, X, Loader2 } from 'lucide-react';
import {
  CREATE_WAREHOUSE_TRANSFER,
  POST_WAREHOUSE_TRANSFER,
  GET_WAREHOUSE_TRANSFERS,
} from '@/lib/graphql/transfers';
import { GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';
import { GET_WAREHOUSE_STOCK } from '@/lib/graphql/inventory';
import { toast } from 'sonner';

interface TransferItemInput {
  product_id: string;
  quantity: number;
  product_name?: string;
  available_stock?: number;
  sku?: string;
}

interface CreateTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialProductId?: string; // For pre-filling from low stock page
}

export function CreateTransferModal({
  open,
  onOpenChange,
  onSuccess,
  initialProductId,
}: CreateTransferModalProps) {
  const params = useParams();
  const companySlug = params?.slug as string;
  const { activeWarehouse } = useWarehouse();

  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItemInput[]>([]);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [draftTransferId, setDraftTransferId] = useState<string | null>(null);
  const [hasPrefilledItem, setHasPrefilledItem] = useState(false);

  const { data: warehousesData, loading: loadingWarehouses } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });

  const { data: stockData, loading: loadingStock } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: { warehouseId: activeWarehouse?.id || '' },
    skip: !activeWarehouse?.id,
  });

  const [createTransfer, { loading: creating }] = useMutation(CREATE_WAREHOUSE_TRANSFER, {
    refetchQueries: [{ query: GET_WAREHOUSE_TRANSFERS, variables: { filters: { limit: 100 } } }],
  });

  const [postTransfer, { loading: posting }] = useMutation(POST_WAREHOUSE_TRANSFER, {
    refetchQueries: [{ query: GET_WAREHOUSE_TRANSFERS, variables: { filters: { limit: 100 } } }],
  });

  const warehouses = (warehousesData?.companyBySlug?.warehouses || []).filter(
    (w: any) => w.id !== activeWarehouse?.id
  );

  const stock = stockData?.stockByWarehouse || [];

  // Auto-prefill item from URL query params or props
  useEffect(() => {
    if (hasPrefilledItem || !stock.length || !initialProductId) return;

    const stockItem = stock.find((s: any) => s.product.id === initialProductId);

    if (stockItem) {
      setItems([
        {
          product_id: stockItem.product.id,
          quantity: 0,
          product_name: stockItem.product.name,
          available_stock: Number(stockItem.quantity),
          sku: stockItem.product.sku,
        },
      ]);
      setHasPrefilledItem(true);
    }
  }, [initialProductId, stock, hasPrefilledItem]);

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
        toast.error(`Insufficient stock for ${item.product_name}. Available: ${item.available_stock}`);
        return false;
      }
    }

    const productIds = items.map((i) => i.product_id);
    if (new Set(productIds).size !== productIds.length) {
      toast.error('Cannot add the same product multiple times');
      return false;
    }

    return true;
  };

  const handleClose = () => {
    setDestinationWarehouseId('');
    setNotes('');
    setItems([]);
    setDraftTransferId(null);
    setHasPrefilledItem(false);
    onOpenChange(false);
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
      setShowPostDialog(false);
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error posting transfer:', error);
      toast.error(error.message || 'Failed to post transfer');
    }
  };

  const handleSaveAndExit = () => {
    toast.success('Transfer saved as draft');
    setShowPostDialog(false);
    handleClose();
    onSuccess?.();
  };

  return (
    <>
      <Dialog open={open && !showPostDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Warehouse Transfer</DialogTitle>
            <DialogDescription>
              Move stock from {activeWarehouse?.name} to another warehouse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Warehouse Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From Warehouse</Label>
                <Input value={activeWarehouse?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>
                  To Warehouse <span className="text-red-500">*</span>
                </Label>
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

            {/* Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Transfer Items</Label>
                <Button onClick={addItem} size="sm" variant="outline" disabled={loadingStock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  No items added yet. Click &quot;Add Item&quot; to begin.
                </div>
              ) : (
                <div className="border rounded-lg">
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
                        <TableRow key={index}>
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
                                        items[index].product_id !== s.product.id
                                    )}
                                  >
                                    {s.product.name} (Stock: {s.quantity})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.sku || '—'}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.available_stock !== undefined ? item.available_stock : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
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
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any additional notes about this transfer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={creating || posting}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={creating || posting || items.length === 0}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Post'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Confirmation Dialog */}
      <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
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
              {posting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

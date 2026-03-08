'use client';

import { useMemo, useState } from 'react';
import { useCreateOpeningStock, useProducts, useWarehouseStockHealth } from '@/hooks/apollo';
import { differenceInCalendarDays, format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { SafeBarcodeScanInput } from '@/components/barcode/SafeBarcodeScanInput';

import { CopyButton } from '@/components/common/CopyButton';

interface OpeningStockModalProps {
  warehouseId: string;
  open: boolean;
  onClose: () => void;
}

export default function OpeningStockModal({ warehouseId, open, onClose }: OpeningStockModalProps) {
  const { toast } = useToast();

  const [lastScan, setLastScan] = useState<{
    barcode: string;
    productId: string;
    productName: string;
    sku: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    expiry_date: '',
    note: '',
  });

  const { data: productsData } = useProducts();

  const { data: stockHealthData } = useWarehouseStockHealth(warehouseId);

  const stockHealthByProductId = useMemo(() => {
    const rows = (stockHealthData?.warehouseStockHealth ?? []) as any[];
    const map = new Map<string, any>();
    for (const row of rows) {
      if (row?.productId) map.set(row.productId, row);
    }
    return map;
  }, [stockHealthData]);

  const [createOpeningStock, { loading }] = useCreateOpeningStock();

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (!warehouseId) return false;
    if (!formData.product_id) return false;

    // Quantity must be explicitly entered; do not allow barcode to imply it.
    if (formData.quantity.trim() === '') return false;

    const qty = Number(formData.quantity);
    if (!Number.isFinite(qty)) return false;
    if (qty < 0) return false;

    return true;
  }, [formData.product_id, formData.quantity, loading, warehouseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.quantity) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!warehouseId) {
      toast({
        title: 'Error',
        description: 'Warehouse ID not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createOpeningStock({
        variables: {
          input: {
            product_id: formData.product_id,
            warehouse_id: warehouseId,
            quantity: parseInt(formData.quantity),
            expiry_date: formData.expiry_date || undefined,
            note: formData.note || null,
          },
        },
      });
      toast({
        title: 'Opening stock created',
        description: 'Opening stock has been added successfully',
      });
      setFormData({ product_id: '', quantity: '', expiry_date: '', note: '' });
      setLastScan(null);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create opening stock',
        variant: 'destructive',
      });
    }
  };

  const products = productsData?.products?.filter((p: any) => p.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Opening Stock</DialogTitle>
            <DialogDescription>
              Set the initial stock quantity for a product in this warehouse
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
            <SafeBarcodeScanInput
              context="OPENING_STOCK"
              label="Scan barcode to select product"
              description="Scan selects the product. If expiry is encoded, it will auto-fill the expiry date."
              onProductResolved={(product, scannedBarcode, scanMeta) => {
                setLastScan({
                  barcode: scannedBarcode,
                  productId: product.id,
                  productName: product.name,
                  sku: product.sku,
                });
                setFormData((prev) => ({
                  ...prev,
                  product_id: product.id,
                  ...(scanMeta?.expiryDate ? { expiry_date: scanMeta.expiryDate } : {}),
                }));

                if (scanMeta?.expiryDate) {
                  toast({
                    title: 'Expiry auto-filled',
                    description: 'Expiry date was parsed from the scan payload',
                  });
                }
              }}
              onError={(message) =>
                toast({
                  title: 'Barcode scan failed',
                  description: message,
                  variant: 'destructive',
                })
              }
            />

            {lastScan ? (
              <div className="rounded-md border bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                <div className="font-medium">
                  Product selected via barcode. Please confirm inputs.
                </div>
                <div className="mt-1 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1">
                    <span>
                      Selected: {lastScan.productName} ({lastScan.sku})
                    </span>
                    <CopyButton
                      value={lastScan.sku}
                      ariaLabel="Copy SKU"
                      successMessage="Copied SKU to clipboard"
                      className="h-6 w-6 text-muted-foreground"
                    />
                  </div>
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
                      <div>Current usable stock here: {usableStock}</div>
                      <div>
                        Nearest expiry here: {expiryLabel}
                        {hasExpiryWarning ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            expiring soon
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : null}

            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">
                Product <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                required
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
              {(() => {
                const selectedProduct = products.find((p: any) => p.id === formData.product_id);
                if (!selectedProduct?.sku) return null;

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

            {/* Expiry Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                placeholder="YYYY-MM-DD"
              />
              <p className="text-xs text-muted-foreground">
                Recommended for perishables. Leave empty for non-expiring stock.
              </p>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Initial Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Add a note about this opening stock..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 flex-none">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? 'Creating...' : 'Create Opening Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

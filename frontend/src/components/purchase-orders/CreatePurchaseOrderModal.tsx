'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X, Loader2 } from 'lucide-react';
import { CREATE_PURCHASE_ORDER, GET_PURCHASE_ORDERS } from '@/lib/graphql/purchase-orders';
import { GET_WAREHOUSES_BY_COMPANY } from '@/lib/graphql/company';
import { GET_SUPPLIERS } from '@/lib/graphql/catalog';
import { GET_STOCK_BY_WAREHOUSE } from '@/lib/graphql/stock';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { CopyButton } from '@/components/common/CopyButton';
import { BarcodeScanInput } from '@/components/barcode/BarcodeScanInput';

interface POItem {
  product_id: string;
  product_name?: string;
  ordered_quantity: number | string;
}

interface CreatePurchaseOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialWarehouseId?: string;
  initialSupplierId?: string;
  initialProductId?: string;
}

export function CreatePurchaseOrderModal({
  open,
  onOpenChange,
  onSuccess,
  initialWarehouseId,
  initialSupplierId,
  initialProductId,
}: CreatePurchaseOrderModalProps) {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.slug as string;
  const { user } = useAuth();

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [supplierAutoFilled, setSupplierAutoFilled] = useState(false);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItem[]>([{ product_id: '', ordered_quantity: 1 }]);
  const [hasPrefilledData, setHasPrefilledData] = useState(false);

  const { data: warehousesData } = useQuery(GET_WAREHOUSES_BY_COMPANY, {
    variables: { slug: companySlug },
    fetchPolicy: 'cache-and-network',
  });

  const { data: suppliersData } = useQuery(GET_SUPPLIERS, {
    variables: { includeArchived: false },
    fetchPolicy: 'cache-and-network',
  });

  const { data: productsData } = useQuery(GET_STOCK_BY_WAREHOUSE, {
    variables: { warehouseId: selectedWarehouse },
    skip: !selectedWarehouse,
    fetchPolicy: 'cache-and-network',
  });

  const [createPO, { loading }] = useMutation(CREATE_PURCHASE_ORDER, {
    refetchQueries: [{ query: GET_PURCHASE_ORDERS, variables: { filters: { limit: 100 } } }],
    onCompleted: (data) => {
      toast.success('Purchase order created successfully!');
      handleClose();
      onSuccess?.();
      const poId = data?.createPurchaseOrder?.id;
      if (poId && companySlug) {
        router.push(`/${companySlug}/purchase-orders/${poId}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create purchase order');
    },
  });

  const userRole = user?.companies?.find((c: any) => c.slug === companySlug)?.role;
  const userWarehouseIds = user?.warehouses?.map((w: any) => w.warehouseId) || [];
  let warehouses = warehousesData?.companyBySlug?.warehouses || [];
  if (userRole === 'MANAGER') {
    warehouses = warehouses.filter((wh: any) => userWarehouseIds.includes(wh.id));
  }

  const suppliers = suppliersData?.suppliers || [];
  const products = productsData?.stockByWarehouse || [];

  // Auto-prefill from props
  useEffect(() => {
    if (hasPrefilledData) return;

    if (initialWarehouseId && warehouses.some((w: any) => w.id === initialWarehouseId)) {
      setSelectedWarehouse(initialWarehouseId);
    }

    if (initialSupplierId && suppliers.some((s: any) => s.id === initialSupplierId)) {
      setSelectedSupplier(initialSupplierId);
    }

    if (initialProductId && products.length > 0) {
      const product = products.find((p: any) => p.product.id === initialProductId);
      if (product) {
        setItems([
          {
            product_id: product.product.id,
            product_name: product.product.name,
            ordered_quantity: 1,
          },
        ]);
        setHasPrefilledData(true);
      }
    }
  }, [
    initialWarehouseId,
    initialSupplierId,
    initialProductId,
    warehouses,
    suppliers,
    products,
    hasPrefilledData,
  ]);

  const addItem = () => {
    setItems([...items, { product_id: '', ordered_quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addOrIncrementItem = (productId: string, quantityToAdd: number) => {
    const safeQtyRaw = Number.isFinite(quantityToAdd) && quantityToAdd > 0 ? quantityToAdd : 1;
    const safeQty = Math.max(1, Math.floor(safeQtyRaw));

    setItems((prev) => {
      const existingIndex = prev.findIndex((it) => it.product_id === productId);
      if (existingIndex !== -1) {
        const next = [...prev];
        const currentQty = Number.isFinite(next[existingIndex].ordered_quantity)
          ? next[existingIndex].ordered_quantity
          : 1;
        next[existingIndex] = {
          ...next[existingIndex],
          ordered_quantity: Math.max(1, currentQty + safeQty),
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

  const autoSelectSupplierForProduct = (productId: string) => {
    if (!productId) return;
    const stockRow = products.find((p: any) => p?.product?.id === productId);
    const supplierId = stockRow?.product?.supplier_id || stockRow?.product?.supplier?.id || '';
    if (supplierId) {
      setSelectedSupplier(supplierId);
      setSupplierAutoFilled(true);
      return;
    }
    setSupplierAutoFilled(false);
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value);
    setSupplierAutoFilled(false);
  };

  useEffect(() => {
    if (!selectedWarehouse || selectedSupplier) return;
    const firstProductId = items?.[0]?.product_id;
    if (!firstProductId || !products || products.length === 0) return;
    autoSelectSupplierForProduct(firstProductId);
  }, [selectedWarehouse, selectedSupplier, items, products]);

  const handleClose = () => {
    setSelectedWarehouse('');
    setSelectedSupplier('');
    setSupplierAutoFilled(false);
    setNotes('');
    setItems([{ product_id: '', ordered_quantity: 1 }]);
    setHasPrefilledData(false);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedWarehouse) {
      toast.error('Please select a warehouse');
      return;
    }
    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }
    if (
      items.length === 0 ||
      items.some((item) => !item.product_id || item.ordered_quantity <= 0)
    ) {
      toast.error('Please add at least one valid product');
      return;
    }

    createPO({
      variables: {
        input: {
          warehouse_id: selectedWarehouse,
          supplier_id: selectedSupplier,
          items: items.map((item) => ({
            product_id: item.product_id,
            ordered_quantity: parseFloat(item.ordered_quantity.toString()),
          })),
          notes: notes || undefined,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>Add products to create a new purchase order</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warehouse & Supplier */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="warehouse">
                Warehouse <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger id="warehouse" className="w-full">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">
                Supplier <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedSupplier} onValueChange={handleSupplierChange}>
                <SelectTrigger id="supplier" className="w-full">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup: any) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {supplierAutoFilled && (
                <p className="text-xs text-muted-foreground">
                  Auto-selected from the chosen product — you can change it.
                </p>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Products</Label>
              <Button onClick={addItem} size="sm" variant="outline" disabled={!selectedWarehouse}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            <BarcodeScanInput
              label="Scan barcode"
              description={
                selectedWarehouse
                  ? 'Scan a product barcode to add it to the purchase order (or increase quantity).'
                  : 'Select a warehouse first to enable barcode scanning.'
              }
              disabled={!selectedWarehouse}
              onProductResolved={(product, _scanned, scanMeta) => {
                if (!selectedWarehouse) {
                  toast.error('Please select a warehouse first');
                  return;
                }

                const stockRow = products.find((p: any) => p?.product?.id === product.id);
                if (!stockRow) {
                  toast.error('Scanned product is not available in the selected warehouse list');
                  return;
                }

                const qty = typeof scanMeta?.quantity === 'number' ? scanMeta.quantity : 1;
                addOrIncrementItem(product.id, qty);
                autoSelectSupplierForProduct(product.id);
              }}
              onError={(message) => toast.error(message)}
            />

            {!selectedWarehouse ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                Select a warehouse first to add products
              </p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(0,1fr)_7rem_auto] grid-rows-[auto_auto_auto] gap-x-3 gap-y-2 p-3 border rounded-lg bg-muted/30"
                  >
                    <Label className="text-xs col-start-1 row-start-1">Product *</Label>
                    <div className="col-start-1 row-start-2 min-w-0">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => {
                          updateItem(index, 'product_id', value);
                          autoSelectSupplierForProduct(value);
                        }}
                      >
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((stock: any) => (
                            <SelectItem key={stock.product.id} value={stock.product.id}>
                              {stock.product.name} ({stock.product.sku}) - Current: {stock.quantity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(() => {
                      const selectedStock = products.find(
                        (s: any) => s.product?.id === item.product_id,
                      );
                      if (!selectedStock?.product?.sku) return null;

                      return (
                        <div className="col-start-1 row-start-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="font-mono">SKU: {selectedStock.product.sku}</span>
                          <CopyButton
                            value={selectedStock.product.sku}
                            ariaLabel="Copy SKU"
                            successMessage="Copied SKU to clipboard"
                            className="h-6 w-6 text-muted-foreground"
                          />
                        </div>
                      );
                    })()}

                    <Label className="text-xs col-start-2 row-start-1">Quantity *</Label>
                    <div className="col-start-2 row-start-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.ordered_quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'ordered_quantity',
                            e.target.value === '' ? '' : parseInt(e.target.value) || '',
                          )
                          
                        }
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (!val || val < 1) updateItem(index, 'ordered_quantity', 1);
                        }}
                      />
                    </div>

                    <div className="col-start-3 row-start-2 flex items-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Purchase Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

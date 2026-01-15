'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/components/ui/use-toast';
import {
  Package,
  Building2,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  X,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ADJUST_STOCK,
  UPDATE_STOCK_LEVELS,
  GET_STOCK_MOVEMENTS,
  GET_WAREHOUSE_STOCK,
} from '@/lib/graphql/inventory';

interface StockDrawerProps {
  stock: any;
  open: boolean;
  onClose: () => void;
  canModify?: boolean;
}

export default function StockDrawer({ stock, open, onClose, canModify = false }: StockDrawerProps) {
  const { toast } = useToast();
  const [isEditingLevels, setIsEditingLevels] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [levelForm, setLevelForm] = useState({
    min_stock_level: stock?.min_stock_level ? stock.min_stock_level.toString() : '',
    max_stock_level: stock?.max_stock_level ? stock.max_stock_level.toString() : '',
    reorder_point: stock?.reorder_point ? stock.reorder_point.toString() : '',
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    type: 'ADJUSTMENT',
    reason: '',
    notes: '',
  });

  // Reset form states when stock changes (e.g., opening drawer for a different item)
  useEffect(() => {
    if (stock) {
      setLevelForm({
        min_stock_level: stock.min_stock_level ? stock.min_stock_level.toString() : '',
        max_stock_level: stock.max_stock_level ? stock.max_stock_level.toString() : '',
        reorder_point: stock.reorder_point ? stock.reorder_point.toString() : '',
      });
      setAdjustForm({
        quantity: '',
        type: 'ADJUSTMENT',
        reason: '',
        notes: '',
      });
      setIsEditingLevels(false);
      setIsAdjusting(false);
    }
  }, [stock]);

  const [updateLevels, { loading: updatingLevels }] = useMutation(UPDATE_STOCK_LEVELS, {
    refetchQueries: [GET_WAREHOUSE_STOCK],
    onCompleted: () => {
      toast({
        title: 'Stock levels updated',
        description: 'Stock thresholds have been updated successfully',
      });
      setIsEditingLevels(false);
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [adjustStock, { loading: adjustingStock }] = useMutation(ADJUST_STOCK, {
    refetchQueries: [GET_WAREHOUSE_STOCK],
    onCompleted: () => {
      toast({
        title: 'Stock adjusted',
        description: 'Stock quantity has been adjusted successfully',
      });
      setIsAdjusting(false);
      setAdjustForm({ quantity: '', type: 'ADJUSTMENT', reason: '', notes: '' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch recent stock movements for this product in this warehouse
  // Memoize the filters to prevent query re-execution on every render
  const movementFilters = useMemo(
    () => ({
      productId: stock?.product?.id,
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      toDate: new Date().toISOString(),
      limit: 5,
      offset: 0,
    }),
    [stock?.product?.id],
  );

  const { data: movementsData } = useQuery(GET_STOCK_MOVEMENTS, {
    variables: {
      warehouseId: stock?.warehouse?.id,
      filters: movementFilters,
    },
    skip: !stock?.product?.id || !stock?.warehouse?.id || !open,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: false,
  });

  const recentMovements = movementsData?.stockMovements?.items || [];

  if (!stock) return null;

  const handleUpdateLevels = async () => {
    await updateLevels({
      variables: {
        input: {
          id: stock.id,
          min_stock_level: levelForm.min_stock_level ? parseInt(levelForm.min_stock_level) : null,
          max_stock_level: levelForm.max_stock_level ? parseInt(levelForm.max_stock_level) : null,
          reorder_point: levelForm.reorder_point ? parseInt(levelForm.reorder_point) : null,
        },
      },
    });
  };

  const handleAdjustStock = async () => {
    if (!adjustForm.quantity) {
      toast({
        title: 'Validation error',
        description: 'Please enter a quantity to adjust',
        variant: 'destructive',
      });
      return;
    }

    await adjustStock({
      variables: {
        input: {
          product_id: stock.product.id,
          warehouse_id: stock.warehouse.id,
          quantity: parseInt(adjustForm.quantity),
          type: adjustForm.type,
          reason: adjustForm.reason || null,
          notes: adjustForm.notes || null,
        },
      },
    });
  };

  const currentQuantity = parseFloat(stock.quantity);
  const isLowStock = stock.reorder_point && currentQuantity <= parseFloat(stock.reorder_point);

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">{stock.product.name}</SheetTitle>
              <SheetDescription className="font-mono text-sm">
                SKU: {stock.product.sku}
              </SheetDescription>
            </div>
            {isLowStock && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Low Stock
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Current Stock */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Current Stock Level</h3>
            <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="text-3xl font-bold">{Math.round(currentQuantity)}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{stock.product.unit}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Warehouse Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Warehouse</p>
                  <p className="text-sm text-muted-foreground">{stock.warehouse.name}</p>
                </div>
              </div>
              {stock.product.supplier && (
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Supplier</p>
                    <p className="text-sm text-muted-foreground">{stock.product.supplier.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Stock Levels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">Stock Thresholds</h3>
              {canModify && !isEditingLevels && !isAdjusting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingLevels(true)}
                  className="gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>

            {isEditingLevels ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Minimum Stock Level</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    step="1"
                    value={levelForm.min_stock_level}
                    onChange={(e) =>
                      setLevelForm({ ...levelForm, min_stock_level: e.target.value })
                    }
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_stock">Maximum Stock Level</Label>
                  <Input
                    id="max_stock"
                    type="number"
                    step="1"
                    value={levelForm.max_stock_level}
                    onChange={(e) =>
                      setLevelForm({ ...levelForm, max_stock_level: e.target.value })
                    }
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder">Reorder Point</Label>
                  <Input
                    id="reorder"
                    type="number"
                    step="1"
                    value={levelForm.reorder_point}
                    onChange={(e) => setLevelForm({ ...levelForm, reorder_point: e.target.value })}
                    placeholder="e.g., 100"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateLevels}
                    disabled={updatingLevels}
                    className="flex-1 gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updatingLevels ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingLevels(false)}
                    disabled={updatingLevels}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Min Level</p>
                  </div>
                  <p className="text-lg font-bold">{stock.min_stock_level || '—'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Max Level</p>
                  </div>
                  <p className="text-lg font-bold">{stock.max_stock_level || '—'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Reorder</p>
                  </div>
                  <p className="text-lg font-bold">{stock.reorder_point || '—'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Adjust Stock */}
          {canModify && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Adjust Stock</h3>

                {isAdjusting ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="adjust_quantity">
                        Quantity Change <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="adjust_quantity"
                        type="number"
                        step="1"
                        value={adjustForm.quantity}
                        onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                        placeholder="e.g., +50 or -20"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use positive numbers to increase, negative to decrease
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adjust_reason">Reason</Label>
                      <Select
                        value={adjustForm.reason}
                        onValueChange={(value) => setAdjustForm({ ...adjustForm, reason: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                          <SelectItem value="found">Found</SelectItem>
                          <SelectItem value="correction">Correction</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adjust_notes">Notes (Optional)</Label>
                      <Textarea
                        id="adjust_notes"
                        value={adjustForm.notes}
                        onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                        placeholder="Additional details about this adjustment..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAdjustStock}
                        disabled={adjustingStock}
                        className="flex-1 gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {adjustingStock ? 'Adjusting...' : 'Adjust Stock'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAdjusting(false);
                          setAdjustForm({
                            quantity: '',
                            type: 'ADJUSTMENT',
                            reason: '',
                            notes: '',
                          });
                        }}
                        disabled={adjustingStock}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsAdjusting(true)}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isEditingLevels}
                  >
                    <Edit className="h-4 w-4" />
                    Adjust Stock
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Recent Movements */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm text-muted-foreground">Recent Movements</h3>
            </div>
            {recentMovements.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No movements yet</div>
            ) : (
              <div className="space-y-2">
                {recentMovements.map((movement: any) => {
                  const movementType = String(movement.type ?? '');
                  const isOut =
                    movementType === 'OUT' ||
                    /(^|_)OUT$/.test(movementType) ||
                    movementType.includes('OUT');
                  const isIncrease = !isOut;
                  const rawQty = Number(movement.quantity ?? 0);
                  const displayQty = isOut ? -Math.abs(rawQty) : Math.abs(rawQty);

                  const createdAtValue = movement.createdAt ?? movement.created_at;
                  const createdAtDate = createdAtValue ? new Date(createdAtValue) : null;
                  const hasValidCreatedAt =
                    !!createdAtDate && !Number.isNaN(createdAtDate.getTime());
                  return (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-0.5 ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncrease ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {movement.type.replace(/_/g, ' ')}
                            </p>
                            <span
                              className={`text-sm font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {displayQty > 0 ? '+' : ''}
                              {displayQty}
                            </span>
                          </div>
                          {movement.reason && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {movement.reason}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {hasValidCreatedAt
                                ? `${createdAtDate.toLocaleDateString()} ${createdAtDate.toLocaleTimeString(
                                    [],
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )}`
                                : '—'}
                            </p>
                            {movement.performedBy && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {movement.performedBy}
                                </p>
                              </>
                            )}
                            {movement.userRole && (
                              <>
                                <span className="text-xs text-muted-foreground">by</span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                  {movement.userRole}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {(movement.previousQuantity !== undefined ||
                          movement.newQuantity !== undefined ||
                          movement.previous_quantity !== undefined ||
                          movement.new_quantity !== undefined) && (
                          <div className="text-xs text-muted-foreground">
                            {movement.previousQuantity ?? movement.previous_quantity} →{' '}
                            {movement.newQuantity ?? movement.new_quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Metadata */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Metadata</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <p>Created:</p>
                <p className="font-medium text-foreground">
                  {new Date(stock.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p>Updated:</p>
                <p className="font-medium text-foreground">
                  {new Date(stock.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

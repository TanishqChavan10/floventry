'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { GenerateBarcodeLabelsButton } from '@/components/barcode/GenerateBarcodeLabelsButton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Package, Tag, Building2, Ruler, IndianRupee } from 'lucide-react';
import { CopyButton } from '@/components/common/CopyButton';
import type { BarcodeLabelLayout } from '@/lib/graphql/barcode';
import {
  copyThermalLabelsZplToClipboard,
  downloadThermalLabelsZpl,
} from '@/lib/api/thermal-labels';
import { toast } from 'sonner';
import {
  BARCODE_HISTORY,
  PRODUCT_BARCODE_UNITS,
  REMOVE_PRODUCT_BARCODE_UNIT,
  UPSERT_PRODUCT_BARCODE_UNIT,
} from '@/lib/graphql/barcode';

interface ProductDetailDrawerProps {
  product: any;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function ProductDetailDrawer({
  product,
  open,
  onClose,
  onEdit,
}: ProductDetailDrawerProps) {
  if (!product) return null;

  const [labelLayout, setLabelLayout] = useState<BarcodeLabelLayout>('A4_SINGLE');

  const alternateBarcodes: string[] = useMemo(() => {
    const raw = product?.alternate_barcodes;
    if (!Array.isArray(raw)) return [];
    return raw.filter((v: any) => typeof v === 'string' && v.trim().length > 0);
  }, [product]);

  const { data: historyData, loading: historyLoading } = useQuery(BARCODE_HISTORY, {
    variables: { productId: product.id },
    skip: !open || !product?.id,
    fetchPolicy: 'cache-and-network',
  });

  const historyRows = (historyData?.barcodeHistory ?? []) as Array<any>;

  const {
    data: unitsData,
    loading: unitsLoading,
    refetch: refetchUnits,
  } = useQuery(PRODUCT_BARCODE_UNITS, {
    variables: { productId: product.id },
    skip: !open || !product?.id,
    fetchPolicy: 'cache-and-network',
  });

  const units = (unitsData?.productBarcodeUnits ?? []) as Array<any>;

  const [newUnit, setNewUnit] = useState({
    barcode_value: '',
    unit_type: 'PIECE',
    quantity_multiplier: '1',
    is_primary: false,
  });

  const [upsertUnit, { loading: savingUnit }] = useMutation(UPSERT_PRODUCT_BARCODE_UNIT, {
    onCompleted: async () => {
      setNewUnit({
        barcode_value: '',
        unit_type: 'PIECE',
        quantity_multiplier: '1',
        is_primary: false,
      });
      await refetchUnits();
      toast.success('Packaging barcode saved');
    },
    onError: (e) => toast.error(e.message || 'Failed to save packaging barcode'),
  });

  const [removeUnit, { loading: removingUnit }] = useMutation(REMOVE_PRODUCT_BARCODE_UNIT, {
    onCompleted: async () => {
      await refetchUnits();
      toast.success('Packaging barcode removed');
    },
    onError: (e) => toast.error(e.message || 'Failed to remove packaging barcode'),
  });

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pr-10">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">{product.name}</SheetTitle>
              <SheetDescription className="font-mono text-sm">
                <span className="inline-flex items-center gap-1">
                  <span>SKU: {product.sku}</span>
                  <CopyButton
                    value={product.sku}
                    ariaLabel="Copy SKU"
                    successMessage="Copied SKU to clipboard"
                    className="h-7 w-7 text-muted-foreground"
                  />
                </span>
              </SheetDescription>
            </div>
            <Badge className="shrink-0 mt-1" variant={product.is_active ? 'default' : 'secondary'}>
              {product.is_active ? 'Active' : 'Archived'}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Product Image */}
          {product.image_url && (
            <div className="rounded-lg border overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>
            <div className="space-y-3">
              {product.barcode && (
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Barcode</p>
                    <p className="text-sm text-muted-foreground font-mono">{product.barcode}</p>
                  </div>
                </div>
              )}

              {alternateBarcodes.length ? (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Alternate Barcodes</p>
                    <div className="space-y-1">
                      {alternateBarcodes.map((b) => (
                        <div key={b} className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground font-mono">{b}</p>
                          <CopyButton
                            value={b}
                            ariaLabel="Copy barcode"
                            successMessage="Copied barcode to clipboard"
                            className="h-7 w-7 text-muted-foreground"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm text-muted-foreground font-mono">{product.unit}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Barcode History */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Barcode History</h3>
            {historyLoading ? (
              <div className="text-sm text-muted-foreground">Loading history…</div>
            ) : historyRows.length ? (
              <div className="space-y-2">
                {historyRows.slice(0, 20).map((row) => {
                  const changedAt = row?.changed_at ? new Date(row.changed_at) : null;
                  const when =
                    changedAt && Number.isFinite(changedAt.getTime())
                      ? changedAt.toLocaleString()
                      : '—';
                  const type = row?.change_type || '—';
                  const oldV = row?.old_value ?? '';
                  const newV = row?.new_value ?? '';

                  return (
                    <div key={row.id} className="rounded-md border px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">{when}</div>
                        <Badge variant="secondary" className="text-[10px]">
                          {type}
                        </Badge>
                      </div>
                      {oldV || newV ? (
                        <div className="mt-1 text-xs text-muted-foreground font-mono break-all">
                          {oldV ? <span>{oldV}</span> : <span>—</span>} →{' '}
                          {newV ? <span>{newV}</span> : <span>—</span>}
                        </div>
                      ) : null}
                      {row?.reason ? (
                        <div className="mt-1 text-xs text-muted-foreground">{row.reason}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No changes recorded yet.</div>
            )}
          </div>

          {/* Category & Supplier */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Classification</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm text-muted-foreground">
                    {product.category?.name || 'Not categorized'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Supplier</p>
                  <p className="text-sm text-muted-foreground">
                    {product.supplier?.name || 'No supplier'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Cost Price</p>
                </div>
                <p className="text-lg font-bold">
                  {product.cost_price ? `₹${parseFloat(product.cost_price).toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Selling Price</p>
                </div>
                <p className="text-lg font-bold">
                  {product.selling_price ? `₹${parseFloat(product.selling_price).toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Metadata</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <p>Created:</p>
                <p className="font-medium text-foreground">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p>Updated:</p>
                <p className="font-medium text-foreground">
                  {new Date(product.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Packaging Barcodes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Packaging Barcodes</h3>

            {unitsLoading ? (
              <div className="text-sm text-muted-foreground">Loading packaging barcodes…</div>
            ) : units.length ? (
              <div className="space-y-2">
                {units.map((u) => (
                  <div key={u.id} className="rounded-md border px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium font-mono break-all">
                          {u.barcode_value}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {String(u.unit_type)} • ×{Number(u.quantity_multiplier)}
                          {u.is_primary ? ' • primary' : ''}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removingUnit}
                        onClick={async () => {
                          await removeUnit({ variables: { id: u.id } });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No packaging barcodes configured.</div>
            )}

            <div className="rounded-md border p-3 space-y-3">
              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label>Barcode</Label>
                  <Input
                    value={newUnit.barcode_value}
                    onChange={(e) => setNewUnit((p) => ({ ...p, barcode_value: e.target.value }))}
                    placeholder="Scan or type packaging barcode"
                    disabled={savingUnit}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Unit type</Label>
                    <Select
                      value={newUnit.unit_type}
                      onValueChange={(v) => setNewUnit((p) => ({ ...p, unit_type: v }))}
                      disabled={savingUnit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIECE">Piece</SelectItem>
                        <SelectItem value="PACK">Pack</SelectItem>
                        <SelectItem value="CARTON">Carton</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Multiplier</Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={newUnit.quantity_multiplier}
                      onChange={(e) =>
                        setNewUnit((p) => ({ ...p, quantity_multiplier: e.target.value }))
                      }
                      disabled={savingUnit}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newUnit.is_primary}
                    onCheckedChange={(v) => setNewUnit((p) => ({ ...p, is_primary: Boolean(v) }))}
                    disabled={savingUnit}
                    id="unit-primary"
                  />
                  <Label htmlFor="unit-primary">Mark as primary packaging barcode</Label>
                </div>

                <Button
                  type="button"
                  disabled={
                    savingUnit ||
                    !newUnit.barcode_value.trim() ||
                    !Number.isFinite(Number(newUnit.quantity_multiplier)) ||
                    Number(newUnit.quantity_multiplier) <= 0
                  }
                  onClick={async () => {
                    await upsertUnit({
                      variables: {
                        input: {
                          product_id: product.id,
                          barcode_value: newUnit.barcode_value,
                          unit_type: newUnit.unit_type,
                          quantity_multiplier: Number(newUnit.quantity_multiplier),
                          is_primary: newUnit.is_primary,
                        },
                      },
                    });
                  }}
                >
                  {savingUnit ? 'Saving…' : 'Add Packaging Barcode'}
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-2">
            {product.barcode && (
              <>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Label layout</div>
                  <Select
                    value={labelLayout}
                    onValueChange={(v) => setLabelLayout(v as BarcodeLabelLayout)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4_SINGLE">A4 (1 per page)</SelectItem>
                      <SelectItem value="A4_2X4">A4 2×4 (8 per page)</SelectItem>
                      <SelectItem value="A4_3X8">A4 3×8 (24 per page)</SelectItem>
                      <SelectItem value="THERMAL_50X25">Thermal 50×25mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <GenerateBarcodeLabelsButton
                  productIds={[product.id]}
                  filename={`barcode-label_${product.sku || product.id}.pdf`}
                  variant="outline"
                  size="default"
                  layout={labelLayout}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await downloadThermalLabelsZpl({
                        productIds: [product.id],
                        filename: `thermal-label_${product.sku || product.id}.zpl`,
                        copies: 1,
                        labelSize: '4x6',
                      });
                      toast.success('ZPL downloaded');
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to generate ZPL');
                    }
                  }}
                >
                  Download Thermal ZPL (4×6)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await copyThermalLabelsZplToClipboard({
                        productIds: [product.id],
                        copies: 1,
                        labelSize: '4x6',
                      });
                      toast.success('ZPL copied to clipboard');
                    } catch (e: any) {
                      toast.error(e?.message || 'Failed to copy ZPL');
                    }
                  }}
                >
                  Copy Thermal ZPL (4×6)
                </Button>
              </>
            )}

            {onEdit && (
              <Button onClick={onEdit} className="w-full gap-2">
                <Edit className="h-4 w-4" />
                Edit Product
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

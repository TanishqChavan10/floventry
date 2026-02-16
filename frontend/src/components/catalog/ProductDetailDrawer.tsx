'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { toast } from 'sonner';
import {
  BARCODE_HISTORY,
  PRODUCT_BARCODE_UNITS,
  REMOVE_PRODUCT_BARCODE_UNIT,
  UPSERT_PRODUCT_BARCODE_UNIT,
} from '@/lib/graphql/barcode';
import { UPDATE_PRODUCT } from '@/lib/graphql/catalog';

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

  const [drawerProduct, setDrawerProduct] = useState<any>(product);
  const [newAlternateBarcode, setNewAlternateBarcode] = useState('');

  useEffect(() => {
    if (!open) return;
    setDrawerProduct(product);
    setNewAlternateBarcode('');
  }, [open, product]);

  const [labelLayout, setLabelLayout] = useState<BarcodeLabelLayout>('A4_SINGLE');

  const alternateBarcodes: string[] = useMemo(() => {
    const raw = drawerProduct?.alternate_barcodes;
    if (!Array.isArray(raw)) return [];
    return raw.filter((v: any) => typeof v === 'string' && v.trim().length > 0);
  }, [drawerProduct]);

  const normalizeClientBarcode = (raw: string): string => {
    const noControls = raw.replace(/[\x00-\x1F\x7F]/g, '');
    const noWhitespace = noControls.replace(/\s+/g, '').trim();
    if (!noWhitespace) return '';
    if (/^\d{13}$/.test(noWhitespace)) return noWhitespace;
    return noWhitespace.toUpperCase();
  };

  const { data: historyData, loading: historyLoading } = useQuery(BARCODE_HISTORY, {
    variables: { productId: drawerProduct.id },
    skip: !open || !drawerProduct?.id,
    fetchPolicy: 'cache-and-network',
  });

  const historyRows = (historyData?.barcodeHistory ?? []) as Array<any>;

  const {
    data: unitsData,
    loading: unitsLoading,
    refetch: refetchUnits,
  } = useQuery(PRODUCT_BARCODE_UNITS, {
    variables: { productId: drawerProduct.id },
    skip: !open || !drawerProduct?.id,
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

  const [updateProduct, { loading: savingAlternates }] = useMutation(UPDATE_PRODUCT, {
    onError: (e) => toast.error(e.message || 'Failed to save alternate barcodes'),
  });

  const saveAlternateBarcodes = async (nextAlternates: string[]) => {
    const primary = normalizeClientBarcode(drawerProduct?.barcode || '');
    const normalized = nextAlternates
      .map((b) => normalizeClientBarcode(b || ''))
      .filter(Boolean);

    const unique = Array.from(new Set(normalized));
    if (primary && unique.includes(primary)) {
      toast.error('Primary barcode cannot also appear in alternate barcodes');
      return;
    }

    // Determine if we're adding or removing
    const currentAlternates = drawerProduct.alternate_barcodes || [];
    const isRemoving = unique.length < currentAlternates.length;
    const isAdding = unique.length > currentAlternates.length;

    try {
      const { data } = await updateProduct({
        variables: {
          input: {
            id: drawerProduct.id,
            alternate_barcodes: unique,
          },
        },
      });

      const updated = (data as any)?.updateProduct;
      if (updated) {
        setDrawerProduct((prev: any) => ({ ...prev, ...updated }));
      }

      if (isRemoving) {
        toast.success('Alternate barcode removed');
      } else if (isAdding) {
        toast.success('Alternate barcode added');
      } else {
        toast.success('Alternate barcodes saved');
      }
    } catch {
      // onError handles user-facing messaging
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setDrawerProduct(product);
          setNewAlternateBarcode('');
          onClose();
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pr-10">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">{drawerProduct.name}</SheetTitle>
              <SheetDescription className="font-mono text-sm">
                <span className="inline-flex items-center gap-1">
                  <span>SKU: {drawerProduct.sku}</span>
                  <CopyButton
                    value={drawerProduct.sku}
                    ariaLabel="Copy SKU"
                    successMessage="Copied SKU to clipboard"
                    className="h-7 w-7 text-muted-foreground"
                  />
                </span>
              </SheetDescription>
            </div>
            <Badge
              className="shrink-0 mt-1"
              variant={drawerProduct.is_active ? 'default' : 'secondary'}
            >
              {drawerProduct.is_active ? 'Active' : 'Archived'}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Product Image */}
          {drawerProduct.image_url && (
            <div className="rounded-lg border overflow-hidden">
              <img
                src={drawerProduct.image_url}
                alt={drawerProduct.name}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>
            <div className="space-y-3">
              {drawerProduct.barcode && (
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Barcode</p>
                    <p className="text-sm text-muted-foreground font-mono">{drawerProduct.barcode}</p>
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={savingAlternates}
                            onClick={async () => {
                              const next = alternateBarcodes.filter((x) => x !== b);
                              await saveAlternateBarcodes(next);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newAlternateBarcode}
                          onChange={(e) => setNewAlternateBarcode(e.target.value)}
                          placeholder="Scan or type alternate barcode"
                          disabled={savingAlternates}
                        />
                        <Button
                          type="button"
                          disabled={
                            savingAlternates ||
                            !normalizeClientBarcode(newAlternateBarcode).length
                          }
                          onClick={async () => {
                            const nextValue = normalizeClientBarcode(newAlternateBarcode);
                            if (!nextValue) return;
                            const next = Array.from(new Set([...alternateBarcodes, nextValue]));
                            await saveAlternateBarcodes(next);
                            setNewAlternateBarcode('');
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Alternate barcodes are for the same single item (not packs/cartons).
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {!alternateBarcodes.length ? (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium">Alternate Barcodes</p>
                    <div className="flex gap-2">
                      <Input
                        value={newAlternateBarcode}
                        onChange={(e) => setNewAlternateBarcode(e.target.value)}
                        placeholder="Scan or type alternate barcode"
                        disabled={savingAlternates}
                      />
                      <Button
                        type="button"
                        disabled={
                          savingAlternates ||
                          !normalizeClientBarcode(newAlternateBarcode).length
                        }
                        onClick={async () => {
                          const nextValue = normalizeClientBarcode(newAlternateBarcode);
                          if (!nextValue) return;
                          await saveAlternateBarcodes([nextValue]);
                          setNewAlternateBarcode('');
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Add alternate barcodes if this product can be scanned with more than one code.
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm text-muted-foreground font-mono">{drawerProduct.unit}</p>
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
                    {drawerProduct.category?.name || 'Not categorized'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Supplier</p>
                  <p className="text-sm text-muted-foreground">
                    {drawerProduct.supplier?.name || 'No supplier'}
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
                  {drawerProduct.cost_price
                    ? `₹${parseFloat(drawerProduct.cost_price).toFixed(2)}`
                    : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Selling Price</p>
                </div>
                <p className="text-lg font-bold">
                  {drawerProduct.selling_price
                    ? `₹${parseFloat(drawerProduct.selling_price).toFixed(2)}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {drawerProduct.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {drawerProduct.description}
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
                  {new Date(drawerProduct.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p>Updated:</p>
                <p className="font-medium text-foreground">
                  {new Date(drawerProduct.updated_at).toLocaleDateString()}
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
                          product_id: drawerProduct.id,
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
            {drawerProduct.barcode && (
              <>
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
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
                    productIds={[drawerProduct.id]}
                    filename={`barcode-label_${drawerProduct.sku || drawerProduct.id}.pdf`}
                    variant="outline"
                    size="default"
                    layout={labelLayout}
                  />
                </div>
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
